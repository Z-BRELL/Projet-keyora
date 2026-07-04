export enum Role {
  BUYER = 'BUYER',
  SELLER = 'SELLER',
  MODERATOR = 'MODERATOR',
  SUPERADMIN = 'SUPERADMIN',
}

export enum ListingStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  PUBLISHED = 'PUBLISHED',
  REJECTED = 'REJECTED',
}

export enum ListingType {
  SALE = 'SALE',
  RENT = 'RENT',
}

export enum PropertyType {
  APARTMENT = 'APARTMENT',
  HOUSE = 'HOUSE',
  LAND = 'LAND',
  COMMERCIAL = 'COMMERCIAL',
}

export enum ModerationAction {
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}