import { useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { FileText, Loader2, Star, Trash2, Upload } from 'lucide-react';
import { db, uid } from '@/lib/db/dexie';
import { Button } from '@/components/ui/button';
import { Empty } from '@/components/ui/empty';
import { parseResumeWithAI } from '@/lib/ai/resume-parser';
import { geminiConfigured } from '@/lib/ai/gemini';
import type { Resume } from '@/lib/types';

export default function ResumePage() {
  const resumes = useLiveQuery(() => db.resumes.orderBy('created_at').reverse().toArray(), []) ?? [];
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async (file: File) => {
    setError(null);
    setBusy(true);
    try {
      const text = await readAsText(file);
      const parsed = await parseResumeWithAI(text);
      const resume: Resume = {
        id: uid('resume'),
        name: file.name.replace(/\.[^.]+$/, '') || 'Resume',
        parsed_data: parsed,
        is_default: resumes.length === 0,
        created_at: new Date().toISOString(),
      };
      await db.resumes.add(resume);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setBusy(false);
    }
  };

  const setDefault = async (id: string) => {
    await db.transaction('rw', db.resumes, async () => {
      await db.resumes.toCollection().modify({ is_default: false });
      await db.resumes.update(id, { is_default: true });
    });
  };

  return (
    <div className="space-y-4">
      <input
        ref={fileRef}
        type="file"
        accept=".pdf,.doc,.docx,.txt"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleUpload(f);
          e.target.value = '';
        }}
      />

      <div className="card p-5 bg-gradient-to-br from-brand-50 to-indigo-50 dark:from-brand-900/30 dark:to-indigo-900/30 border-brand-100 dark:border-brand-900">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-white dark:bg-ink-900 grid place-items-center shadow">
            <FileText className="w-5 h-5 text-brand-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold">Upload your resume</h3>
            <p className="text-xs text-ink-500 mt-0.5">
              {geminiConfigured
                ? 'AI will extract skills, experience, and education automatically.'
                : 'Heuristic parsing (add VITE_GEMINI_API_KEY to enable AI).'}
            </p>
            <Button onClick={() => fileRef.current?.click()} disabled={busy} className="mt-3">
              {busy ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Parsing…
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" /> Choose file
                </>
              )}
            </Button>
            {error && (
              <p className="text-xs text-rose-600 mt-2">{error}</p>
            )}
          </div>
        </div>
      </div>

      {resumes.length === 0 ? (
        <Empty
          icon={FileText}
          title="No resumes yet"
          description="Upload a PDF, DOCX, or TXT — ApplyKaro parses skills automatically."
        />
      ) : (
        <div className="space-y-3">
          {resumes.map((r) => (
            <ResumeCard key={r.id} resume={r} onDefault={setDefault} />
          ))}
        </div>
      )}
    </div>
  );
}

function ResumeCard({ resume, onDefault }: { resume: Resume; onDefault: (id: string) => void }) {
  const p = resume.parsed_data;
  return (
    <article className="card p-4">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">{resume.name}</h3>
            {resume.is_default && (
              <span className="chip-green"><Star className="w-3 h-3" /> Default</span>
            )}
          </div>
          <p className="text-xs text-ink-500 mt-1">
            {p.name || 'Unknown candidate'}
            {p.experience_years != null && ` · ${p.experience_years}+ yrs`}
            {p.location && ` · ${p.location}`}
          </p>
        </div>
        <div className="flex gap-1">
          {!resume.is_default && (
            <button
              onClick={() => onDefault(resume.id)}
              aria-label="Set as default"
              className="w-9 h-9 rounded-full hover:bg-ink-100 dark:hover:bg-ink-800 grid place-items-center"
            >
              <Star className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => db.resumes.delete(resume.id)}
            aria-label="Delete"
            className="w-9 h-9 rounded-full hover:bg-rose-100 dark:hover:bg-rose-900/30 grid place-items-center text-rose-600"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {p.skills.length > 0 && (
        <div>
          <p className="text-[11px] uppercase tracking-wider text-ink-400 mb-1.5">Skills</p>
          <div className="flex flex-wrap gap-1.5">
            {p.skills.slice(0, 14).map((s) => (
              <span key={s} className="chip-ink">{s}</span>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}

async function readAsText(file: File): Promise<string> {
  // MVP: reads raw text. For PDF/DOCX, a real parser (pdf.js/mammoth) would be wired here.
  if (file.type === 'application/pdf' || /\.(pdf|docx?)$/i.test(file.name)) {
    // Fall back to best-effort text extraction
    const buf = await file.arrayBuffer();
    const dec = new TextDecoder('utf-8', { fatal: false });
    return dec.decode(buf);
  }
  return file.text();
}
