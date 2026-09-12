"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createArticle, updateArticle } from "@/actions/article";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

export function ArticleForm({
  initialData,
  articleId,
}: {
  initialData?: { title: string; content: string; thumbnail?: string | null; tags?: string | null; published: boolean };
  articleId?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    title: initialData?.title || "",
    content: initialData?.content || "",
    thumbnail: initialData?.thumbnail || "",
    tags: initialData?.tags || "",
    published:
      initialData?.published !== undefined ? initialData.published : true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.title || !formData.content) {
      setError("Vui lòng nhập đủ tiêu đề và nội dung.");
      return;
    }

    setLoading(true);

    let res;
    if (articleId) {
      res = await updateArticle(articleId, formData);
    } else {
      res = await createArticle(formData);
    }

    if (res.error) {
      setError(res.error);
      setLoading(false);
    } else {
      router.push("/admin/articles");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="space-y-3">
        <Label>Tiêu đề bài viết</Label>
        <Input
          required
          placeholder="Ví dụ: Hướng dẫn sử dụng Arduino cho người mới bắt đầu..."
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        />
      </div>

      <div className="space-y-3">
        <Label>Ảnh đại diện (đường dẫn)</Label>
        <Input
          placeholder="https://..."
          value={formData.thumbnail}
          onChange={(e) =>
            setFormData({ ...formData, thumbnail: e.target.value })
          }
        />
      </div>

      <div className="space-y-3">
        <Label>Nội dung (hỗ trợ Markdown/HTML cơ bản)</Label>
        <Textarea
          required
          rows={15}
          placeholder="Nhập nội dung bài viết..."
          value={formData.content}
          onChange={(e) =>
            setFormData({ ...formData, content: e.target.value })
          }
          className="font-mono"
        />
      </div>

      <div className="space-y-3">
        <Label>Chủ đề</Label>
        <Input
          placeholder="arduino, stem, robot..."
          value={formData.tags}
          onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
        />
      </div>

      <div className="flex items-center space-x-2 pt-2">
        <input
          type="checkbox"
          id="published"
          checked={formData.published}
          onChange={(e) =>
            setFormData({ ...formData, published: e.target.checked })
          }
          className="w-4 h-4 text-primary rounded border-neutral-300 focus:ring-[#FF5722]"
        />
        <Label htmlFor="published">Xuất bản ngay (hiển thị cho khách)</Label>
      </div>

      <div className="pt-4 border-t border-neutral-100">
        <Button
          type="submit"
          disabled={loading}
          className="w-full sm:w-auto bg-primary hover:bg-primary/90"
        >
          {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
          Lưu bài viết
        </Button>
      </div>
    </form>
  );
}
