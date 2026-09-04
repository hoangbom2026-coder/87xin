import * as React from "react";
import { User as UserIcon, Network } from "lucide-react";

export interface ITreeUser {
  id: string;
  username: string;
  parentId: string | null;
  role: string;
  enrolled?: boolean;
  balance?: number;
  agencyBalance?: number;
  lockUntil?: string;
  joinedAt?: string;
}

interface TreeProps {
  users: ITreeUser[];
  parentId: string | null;
  currentLevel?: number;
}

export default function ReferralTree({ users, parentId, currentLevel = 1 }: TreeProps) {
  const children = (Array.isArray(users) ? users : []).filter((u) => u.parentId === parentId);

  if (children.length === 0) return null;

  return (
    <div className={`space-y-4 ${parentId ? "mt-4 ml-8 border-l border-muted pl-8 relative" : ""}`}>
      {children.map((child) => (
        <div key={child.id} className="relative group">
          {parentId && (
            <div className="absolute -left-[33px] top-4 w-2 h-2 bg-primary rounded-full border border-background z-20" />
          )}
          
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center relative z-10 ${child.enrolled ? "bg-primary/20 border border-primary" : "bg-muted border border-transparent"}`}>
              <UserIcon size={16} className={child.enrolled ? "text-primary" : "text-muted-foreground"} />
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-background border px-1.5 py-0.5 rounded text-[8px] font-bold uppercase whitespace-nowrap">
                Lvl {currentLevel}
              </div>
            </div>
            
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold">{child.username}</span>
                {child.agencyBalance !== undefined ? (
                  <span className="text-[10px] bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded text-amber-500 font-mono font-bold">
                    Vốn: {Number(child.agencyBalance).toLocaleString()} VND
                  </span>
                ) : child.balance !== undefined ? (
                  <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground font-mono">
                    {Number(child.balance).toLocaleString()} VND
                  </span>
                ) : null}
              </div>
              <div className="flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                <span className={child.enrolled ? "text-emerald-500 font-medium" : "text-red-500 font-medium"}>
                  {child.enrolled ? "Đại lý Active" : "Thường"}
                </span>
                {child.parentId && (
                  <>
                    <span>•</span>
                    <span>Cấp trên: {users.find(u => u.id === child.parentId)?.username || "Root"}</span>
                  </>
                )}
                {child.joinedAt && (
                  <>
                    <span>•</span>
                    <span>Tham gia: {new Date(child.joinedAt).toLocaleDateString("vi-VN")}</span>
                  </>
                )}
                {child.lockUntil && new Date(child.lockUntil) > new Date() && (
                  <>
                    <span>•</span>
                    <span className="text-destructive font-medium">Khóa đến: {new Date(child.lockUntil).toLocaleDateString("vi-VN")}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <ReferralTree users={users} parentId={child.id} currentLevel={currentLevel + 1} />
        </div>
      ))}
    </div>
  );
}
