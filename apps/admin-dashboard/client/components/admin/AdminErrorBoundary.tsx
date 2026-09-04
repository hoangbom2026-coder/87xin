import * as React from "react";
import { AlertTriangle } from "lucide-react";

type State = { hasError: boolean };

/** Cô lập lỗi widget — không làm sập toàn bộ shell admin. */
export default class AdminErrorBoundary extends React.Component<
  { children: React.ReactNode; title?: string },
  State
> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm">
          <AlertTriangle className="mb-1 inline size-4 text-destructive" />{" "}
          {this.props.title ?? "Lỗi hiển thị widget — tải lại trang hoặc chọn mục khác."}
        </div>
      );
    }
    return this.props.children;
  }
}
