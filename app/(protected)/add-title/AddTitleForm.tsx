"use client";

import {
  createTitleDirectly,
  submitTitle,
  TitleActionState,
} from "@/actions/title";
import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import FormLabel from "@/components/custom/FormLabel";
import {
  Calendar,
  FileText,
  Film,
  ImageIcon,
  LoaderCircle,
  Tag,
  Type,
} from "lucide-react";
import FormInput from "@/components/custom/FormInput";
import MainButton from "@/components/custom/MainButton";

const initialState: TitleActionState = {
  ok: false,
};

const TITLE_TYPES = [
  "MOVIE",
  "SERIES",
  "ANIME",
  "MANGA",
  "MANHWA",
  "GAME",
  "BOOK",
  "NOVEL",
  "COMIC",
  "OTHER",
] as const;

const AddTitleForm = ({
  canCreateDirectly,
}: {
  canCreateDirectly: boolean;
}) => {
  const [mode, setMode] = useState<"submit" | "direct">(
    canCreateDirectly ? "direct" : "submit",
  );

  const [directState, directAction, directPending] = useActionState(
    createTitleDirectly,
    initialState,
  );

  const [submitState, submitAction, submitPending] = useActionState(
    submitTitle,
    initialState,
  );

  const state = mode === "direct" ? directState : submitState;
  const formAction = mode === "direct" ? directAction : submitAction;
  const pending = mode === "direct" ? directPending : submitPending;
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok && state.success) {
      toast.success(state.success);
      formRef.current?.reset();
    }

    if (!state.ok && state.error) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="space-y-5 animate-in slide-in-from-bottom-2 fade-in duration-300"
    >
      {canCreateDirectly && (
        <div className="flex gap-2 rounded-2xl border border-white/10 bg-white/5 p-2">
          <button
            type="button"
            onClick={() => setMode("direct")}
            className={`rounded-xl px-4 py-2 text-sm transition ${mode === "direct" ? "bg-white text-black" : "text-white/70 hover:bg-white/5 hover:text-white"}`}
          >
            Create directly
          </button>

          <button
            type="button"
            onClick={() => {
              setMode("submit");
            }}
            className={`rounded-xl px-4 py-2 text-sm transition ${mode === "submit" ? "bg-white text-black" : "text-white/70 hover:bg-white/5 hover:text-white"}`}
          >
            Submit as a user
          </button>
        </div>
      )}

      <div className="flex gap-7">
        <div>
          <FormLabel>
            Name <Type size={15} />
          </FormLabel>
          <FormInput
            type="text"
            name="name"
            placeholder="Resident Evil 4 Remake"
            required
          />
        </div>

        <div>
          <FormLabel>
            Year <Calendar size={15} />
          </FormLabel>
          <FormInput type="number" name="year" placeholder="2023" />
        </div>

        <div>
          <FormLabel>
            Type <Film size={15} />
          </FormLabel>
          <select
            name="type"
            defaultValue="MOVIE"
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none"
          >
            {TITLE_TYPES.map((type) => (
              <option key={type} value={type} className="bg-black text-white">
                {type}
              </option>
            ))}
          </select>
        </div>

        <div>
          <FormLabel>
            Genre <Tag size={15} />
          </FormLabel>
          <FormInput type="text" name="genre" placeholder="survival horror" />
        </div>
      </div>

      <div>
        <FormLabel>
          Description <FileText size={15} />
        </FormLabel>
        <textarea
          name="description"
          placeholder="short description"
          className="min-h-30 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none"
        />
      </div>

      <div>
        <FormLabel>
          Image URL <ImageIcon size={15} />
        </FormLabel>
        <FormInput
          type="text"
          name="imageUrl"
          placeholder="https://..."
          required={false}
        />
      </div>

      <MainButton type="submit" disabled={pending}>
        {pending ? (
          <LoaderCircle className="animate-spin" />
        ) : canCreateDirectly ? (
          mode === "direct" ? (
            "Create title"
          ) : (
            "Submit for review"
          )
        ) : (
          "Submit for review"
        )}
      </MainButton>
    </form>
  );
};

export default AddTitleForm;
