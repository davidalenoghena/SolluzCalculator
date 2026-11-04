import { Home } from 'lucide-react';
import { ButtonLink } from '../components/ui/Button';
import { PageHeader } from '../components/ui/Section';

export default function NotFound() {
  return (
    <PageHeader eyebrow="404" title="Page not found" description="The page you are looking for doesn’t exist or has been moved.">
      <ButtonLink to="/" className="mt-8" icon={<Home className="h-4 w-4" />}>
        Back to home
      </ButtonLink>
    </PageHeader>
  );
}
