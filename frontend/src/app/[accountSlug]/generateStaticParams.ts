export function generateStaticParams() {
  return [
    { accountSlug: 'personal' },
    { accountSlug: 'team' },
    { accountSlug: 'default' }
  ];
}
