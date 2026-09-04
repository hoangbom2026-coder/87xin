import { Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@game/ui/card";

export type AdminRelatedLink = {
  to: string;
  label: string;
  hint?: string;
};

export default function AdminRelatedLinks({
  title = "Trang liên quan",
  links,
  className,
}: {
  title?: string;
  links: AdminRelatedLink[];
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2 pt-0">
        {links.map((l) => (
          <Link
            key={l.to}
            to={l.to}
            title={l.hint}
            className="rounded-md border border-border bg-muted/30 px-3 py-2 text-sm text-primary transition-colors hover:bg-muted/60"
          >
            {l.label}
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
