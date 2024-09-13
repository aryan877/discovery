import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Strikethrough,
  Italic,
  List,
  ListOrdered,
  LinkIcon,
} from "lucide-react";
import { Toggle } from "@/components/ui/toggle";
import { Separator } from "@/components/ui/separator";
import { Markdown } from "tiptap-markdown";
import { Link } from "@tiptap/extension-link";
import classNames from "classnames";
import { ToggleProps } from "@radix-ui/react-toggle";
import React from "react";

interface ToolbarToggleProps extends Omit<ToggleProps, "type"> {
  children: React.ReactNode;
}

const RichTextEditor = ({
  value,
  onChange,
  disabled = false,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) => {
  const editor = useEditor({
    editorProps: {
      attributes: {
        class: classNames(
          "min-h-[150px] w-full px-3 py-2 text-sm  placeholder:text-neutral-400 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 overflow-auto resize-y",
          { "opacity-50 cursor-not-allowed": disabled }
        ),
      },
    },
    editable: !disabled,
    extensions: [
      StarterKit.configure({
        orderedList: {
          HTMLAttributes: {
            class: "list-decimal pl-4",
          },
        },
        bulletList: {
          HTMLAttributes: {
            class: "list-disc pl-4",
          },
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-blue-400 underline",
        },
      }),
      Markdown.configure({
        html: true,
        tightLists: true,
        tightListClass: "tight",
        bulletListMarker: "-",
        linkify: true,
        breaks: false,
        transformPastedText: true,
        transformCopiedText: true,
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.storage.markdown.getMarkdown());
    },
  });

  const addLink = () => {
    const url = prompt("Enter the URL");
    if (url && editor) {
      editor
        .chain()
        .focus()
        .extendMarkRange("link")
        .setLink({ href: url })
        .run();
    }
  };

  return (
    <div className="border border-neutral-600 rounded-md overflow-hidden bg-neutral-800">
      <EditorContent editor={editor} />
      {editor ? (
        <RichTextEditorToolbar
          editor={editor}
          disabled={disabled}
          addLink={addLink}
        />
      ) : null}
    </div>
  );
};

const RichTextEditorToolbar = ({
  editor,
  disabled,
  addLink,
}: {
  editor: Editor;
  disabled: boolean;
  addLink: () => void;
}) => {
  return (
    <div
      className={classNames(
        "bg-neutral-800 p-1 flex flex-row items-center border-t border-neutral-600",
        { "opacity-50 cursor-not-allowed": disabled }
      )}
    >
      <ToolbarToggle
        pressed={editor.isActive("bold")}
        onPressedChange={() => editor.chain().focus().toggleBold().run()}
        disabled={disabled}
      >
        <Bold className="h-4 w-4" />
      </ToolbarToggle>
      <ToolbarToggle
        pressed={editor.isActive("italic")}
        onPressedChange={() => editor.chain().focus().toggleItalic().run()}
        disabled={disabled}
      >
        <Italic className="h-4 w-4" />
      </ToolbarToggle>
      <ToolbarToggle
        pressed={editor.isActive("strike")}
        onPressedChange={() => editor.chain().focus().toggleStrike().run()}
        disabled={disabled}
      >
        <Strikethrough className="h-4 w-4" />
      </ToolbarToggle>
      <Separator
        orientation="vertical"
        className="w-[1px] h-6 bg-neutral-600 mx-1"
      />
      <ToolbarToggle
        pressed={editor.isActive("bulletList")}
        onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
        disabled={disabled}
      >
        <List className="h-4 w-4" />
      </ToolbarToggle>
      <ToolbarToggle
        pressed={editor.isActive("orderedList")}
        onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
        disabled={disabled}
      >
        <ListOrdered className="h-4 w-4" />
      </ToolbarToggle>
      <Separator
        orientation="vertical"
        className="w-[1px] h-6 bg-neutral-600 mx-1"
      />
      <ToolbarToggle
        pressed={editor.isActive("link")}
        onPressedChange={addLink}
        disabled={disabled}
      >
        <LinkIcon className="h-4 w-4" />
      </ToolbarToggle>
    </div>
  );
};

const ToolbarToggle: React.FC<ToolbarToggleProps> = ({
  children,
  ...props
}) => (
  <Toggle
    size="sm"
    className="hover:bg-white hover:text-neutral-800 data-[state=on]:bg-white data-[state=on]:text-neutral-800 group"
    {...props}
  >
    {React.cloneElement(children as React.ReactElement, {
      className:
        "h-4 w-4 group-hover:text-neutral-800 group-data-[state=on]:text-neutral-800",
    })}
  </Toggle>
);

export default RichTextEditor;
