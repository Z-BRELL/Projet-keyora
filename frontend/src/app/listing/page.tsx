import ListingsPageContent from './listings-content';

export default function ListingsPage({
  searchParams,
}: {
  searchParams?: { type?: string };
}) {
  const typeFromUrl = searchParams?.type || 'ALL';
  return <ListingsPageContent typeFromUrl={typeFromUrl} />;
}
