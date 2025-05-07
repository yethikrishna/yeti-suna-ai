import { redirect } from 'next/navigation';

type AccountParams = {
  accountSlug: string;
};

export function generateStaticParams() {
  return [
    { accountSlug: 'personal' },
    { accountSlug: 'team' },
    { accountSlug: 'default' }
  ];
}

export default function AccountRedirect({
  params,
}: {
  params: AccountParams;
}) {
  const { accountSlug } = params;

  // Redirect to the settings page
  redirect(`/${accountSlug}/settings`);
}
