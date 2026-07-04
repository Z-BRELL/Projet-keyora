import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../common/mail/mail.service';

@Injectable()
export class AlertsService {
  private readonly logger = new Logger(AlertsService.name);

  constructor(
    private prisma: PrismaService,
    private mail: MailService,
  ) {}

  // ─── Créer une zone d'alerte ──────────────────────────────────────────────
  async createZone(
    userId: string,
    label: string,
    geoJson: any,
    filters?: any,
  ) {
    return this.prisma.alertZone.create({
      data: { userId, label, geoJson, filters },
      include: { _count: { select: { matches: true } } },
    });
  }

  // ─── Mes zones ────────────────────────────────────────────────────────────
  async getUserZones(userId: string) {
    return this.prisma.alertZone.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { matches: true } } },
    });
  }

  // ─── Éditer une zone d'alerte ─────────────────────────────────────────────
  async updateZone(id: string, userId: string, data: any) {
    const zone = await this.prisma.alertZone.findFirst({ where: { id, userId } });
    if (!zone) return null;
    return this.prisma.alertZone.update({
      where: { id },
      data: {
        label: data.label ?? zone.label,
        geoJson: data.geoJson ?? zone.geoJson,
        filters: data.filters ?? zone.filters,
      },
      include: { _count: { select: { matches: true } } },
    });
  }

  // ─── Supprimer une zone ───────────────────────────────────────────────────
  async deleteZone(id: string, userId: string) {
    await this.prisma.alertZone.deleteMany({ where: { id, userId } });
    return { message: 'Zone supprimée' };
  }

  // ─── Activer / désactiver une zone ────────────────────────────────────────
  async toggleZone(id: string, userId: string) {
    const zone = await this.prisma.alertZone.findFirst({ where: { id, userId } });
    if (!zone) return null;
    return this.prisma.alertZone.update({
      where: { id },
      data: { active: !zone.active },
      include: { _count: { select: { matches: true } } },
    });
  }

  // ─── Listener : déclenché quand une annonce est publiée ───────────────────
  // Vérifie via PostGIS ST_Within si le bien est dans les zones actives.
  @OnEvent('listing.published')
  async handleListingPublished(listing: any) {
    this.logger.log(`[Alertes] Annonce publiée : ${listing.id} — vérification des zones`);

    try {
      // Récupération de toutes les zones actives
      const allZones = await this.prisma.alertZone.findMany({
        where: { active: true },
        include: { user: { select: { email: true, fullName: true } } },
      });

      for (const zone of allZones) {
        if (zone.userId === listing.ownerId) continue;

        // Vérifier via une requête spatiale dédiée
        const match = await this.isPointInZone(
          listing.latitude,
          listing.longitude,
          zone.geoJson as any,
        );

        if (!match) continue;

        // Vérifier les filtres (type de bien, prix, etc.)
        if (!this.matchFilters(listing, zone.filters as any)) continue;

        // Éviter les doublons
        const existing = await this.prisma.alertMatch.findUnique({
          where: { alertZoneId_listingId: { alertZoneId: zone.id, listingId: listing.id } },
        });
        if (existing) continue;

        // Enregistrer le match
        await this.prisma.alertMatch.create({
          data: { alertZoneId: zone.id, listingId: listing.id },
        });

        // Envoyer l'email
        await this.mail.sendAlertEmail(
          zone.user.email,
          zone.user.fullName,
          zone.label,
          {
            id: listing.id,
            title: listing.title,
            price: listing.price,
            city: listing.city,
          },
        );

        this.logger.log(`[Alertes] Email envoyé à ${zone.user.email} pour la zone "${zone.label}"`);
      }
    } catch (err: any) {
      this.logger.error(`[Alertes] Erreur : ${err.message}`);
    }
  }

  // ─── Vérification spatiale via PostGIS ────────────────────────────────────
  private async isPointInZone(lat: number, lng: number, geoJson: any): Promise<boolean> {
    try {
      const result = await this.prisma.$queryRaw<{ inside: boolean }[]>`
        SELECT ST_Within(
          ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326),
          ST_GeomFromGeoJSON(${JSON.stringify(geoJson)})
        ) as inside
      `;
      return result[0]?.inside || false;
    } catch {
      return false;
    }
  }

  // ─── Vérification des filtres ─────────────────────────────────────────────
  private matchFilters(listing: any, filters: any): boolean {
    if (!filters) return true;
    if (filters.type && filters.type !== listing.type) return false;
    if (filters.propertyType && filters.propertyType !== listing.propertyType) return false;
    if (filters.minPrice && listing.price < filters.minPrice) return false;
    if (filters.maxPrice && listing.price > filters.maxPrice) return false;
    if (filters.minArea && listing.area < filters.minArea) return false;
    return true;
  }
}
