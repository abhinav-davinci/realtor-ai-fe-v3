"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  MoreVertical,
  MapPin,
  BedDouble,
  Maximize2,
  Share2,
  Video,
  Loader2,
  CircleCheck,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { Property } from "@/lib/properties";
import { api } from "@/lib/api";
import { SparkleIcon } from "@/components/content/brand-glyphs";
import { SharePublishModal } from "./share-modal";
function StatusBadge({ status }: { status: Property["status"] }) {
  if (status === "ready") {
    return (
      <span className="bg-brand-green absolute top-3 left-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium text-white shadow-sm">
        <CircleCheck className="size-3.5" />
        Video Ready
      </span>
    );
  }
  if (status === "processing") {
    return (
      <span className="bg-brand-orange absolute top-3 left-3 inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium text-white shadow-sm">
        Processing
      </span>
    );
  }
  return null;
}

function ProgressOverlay({ progress }: { progress: number }) {
  return (
    <div className="absolute inset-x-3 bottom-3 rounded-lg bg-black/55 p-2.5 backdrop-blur-sm">
      <div className="flex items-center justify-between text-xs font-medium text-white">
        <span>Creating Your Video... {progress}%</span>
        <span>{progress}%</span>
      </div>
      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white/25">
        <div
          className="bg-brand-orange h-full rounded-full"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

function CardCta({
  status,
  onPreview,
  onCreate,
}: {
  status: Property["status"];
  onPreview: () => void;
  onCreate: () => void;
}) {
  if (status === "processing") {
    return (
      <button
        type="button"
        disabled
        className="text-ink-muted inline-flex h-10 w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-black/[0.05] text-sm font-medium @[330px]:flex-1"
      >
        <Loader2 className="size-4 animate-spin" />
        Generating...
      </button>
    );
  }
  if (status === "ready") {
    return (
      <Button
        onClick={onPreview}
        className="bg-brand-blue hover:bg-brand-blue-hover h-10 w-full rounded-xl text-sm font-semibold text-white @[330px]:flex-1"
      >
        <Video className="size-4" />
        Preview Video
      </Button>
    );
  }
  return (
    <Button
      onClick={onCreate}
      className="bg-brand-blue hover:bg-brand-blue-hover h-10 w-full rounded-xl text-sm font-semibold text-white @[330px]:flex-1"
    >
      <SparkleIcon className="size-4" />
      Create Video & Content
    </Button>
  );
}

export function PropertyCard({
  property,
  onDeleted,
}: {
  property: Property;
  onDeleted?: (id: string) => void;
}) {
  const { title, location, price, perMonth, listingType, bhk, area, image, status, progress, videoUrl } =
    property;
  const router = useRouter();
  const [playing, setPlaying] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const openDetail = () => router.push(`/property?id=${property.id}`);
  // Stop the click from bubbling (via the dropdown portal) to the card's
  // onClick, which would otherwise navigate to the detail page instead.
  const editProperty = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    router.push(`/add-property/manual?edit=${property.id}`);
  };
  const goCreate = () => router.push("/create-video");
  const preview = () => (videoUrl ? setPlaying(true) : openDetail());

  // Open the styled confirmation dialog (stop the click bubbling to the card).
  const deleteProperty = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setConfirmOpen(true);
  };
  const confirmDelete = async () => {
    if (deleting) return;
    setDeleting(true);
    try {
      await api.listings.remove(property.id);
      setConfirmOpen(false);
      onDeleted?.(property.id);
    } catch {
      setDeleting(false);
      window.alert("Couldn't delete this property. Please try again.");
    }
  };

  return (
    <article
      onClick={openDetail}
      className="@container flex cursor-pointer flex-col overflow-hidden rounded-2xl bg-surface shadow-sm ring-1 ring-black/[0.06] transition-shadow hover:shadow-md hover:ring-black/[0.1]"
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden">
        <Image
          src={image}
          alt={title}
          fill
          sizes="(max-width: 1280px) 50vw, 320px"
          className="object-cover"
        />
        <StatusBadge status={status} />

        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label="Property options"
            onClick={(e) => e.stopPropagation()}
            className="absolute top-3 right-3 grid size-7 place-items-center rounded-full bg-black/35 text-white backdrop-blur-sm transition-colors hover:bg-black/55"
          >
            <MoreVertical className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-36">
            <DropdownMenuItem onClick={editProperty}>
              <Pencil className="size-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onClick={deleteProperty}>
              <Trash2 className="size-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {status === "processing" && progress != null && (
          <ProgressOverlay progress={progress} />
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="space-y-1">
          <h3 className="text-ink line-clamp-2 text-[15px] font-semibold underline decoration-1 underline-offset-2">
            {title}
          </h3>
          <p className="text-ink-muted flex items-center gap-1 text-xs">
            <MapPin className="size-3.5 shrink-0" />
            <span className="truncate">{location}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <p className="text-ink text-lg font-bold">
            ₹{price}
            {perMonth && (
              <span className="text-ink-muted ml-0.5 text-xs font-normal">/month</span>
            )}
          </p>
          <span
            className={cn(
              "bg-tag text-tag-foreground rounded-full px-2 py-0.5 text-[11px] font-medium"
            )}
          >
            {listingType === "rent" ? "For Rent" : "For Sale"}
          </span>
        </div>

        <div className="text-ink-muted flex items-center rounded-lg border border-black/[0.07] text-xs">
          <span className="flex shrink-0 items-center gap-1.5 px-3 py-2 whitespace-nowrap">
            <BedDouble className="size-4 shrink-0" />
            {bhk}
          </span>
          <span className="h-5 w-px shrink-0 bg-black/[0.08]" />
          <span className="flex min-w-0 items-center gap-1.5 px-3 py-2">
            <Maximize2 className="size-4 shrink-0" />
            <span className="truncate">Chargeable Area - {area}</span>
          </span>
        </div>

        <div className="mt-auto flex flex-col gap-2 pt-1 @[330px]:flex-row @[330px]:items-center" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="outline"
            onClick={() => setShareOpen(true)}
            className="text-ink h-10 w-full rounded-xl border-black/10 px-4 text-sm font-medium @[330px]:w-auto"
          >
            <Share2 className="size-4" />
            Share
          </Button>
          <CardCta status={status} onPreview={preview} onCreate={goCreate} />
        </div>
      </div>

      {playing && videoUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6"
          onClick={(e) => {
            e.stopPropagation();
            setPlaying(false);
          }}
        >
          <div className="relative w-full max-w-3xl" onClick={(e) => e.stopPropagation()}>
            <button
              aria-label="Close"
              onClick={() => setPlaying(false)}
              className="absolute -top-10 right-0 text-white/90 hover:text-white"
            >
              <X className="size-6" />
            </button>
            {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
            <video
              src={videoUrl}
              controls
              autoPlay
              className="max-h-[80vh] w-full rounded-xl bg-black"
            />
          </div>
        </div>
      )}

      {shareOpen && (
        <div onClick={(e) => e.stopPropagation()}>
          <SharePublishModal
            target={{
              title,
              location,
              image,
              videoReady: status === "ready",
              url: typeof window !== "undefined" ? `${window.location.origin}/property?id=${property.id}` : "",
            }}
            onClose={() => setShareOpen(false)}
          />
        </div>
      )}

      {confirmOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={(e) => {
            e.stopPropagation();
            if (!deleting) setConfirmOpen(false);
          }}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 text-center shadow-2xl sm:p-8"
            onClick={(e) => e.stopPropagation()}
            style={{ animation: "scale-in 200ms ease-out both" }}
          >
            <span className="mx-auto grid size-14 place-items-center rounded-full bg-red-50">
              <Trash2 className="size-6 text-red-500" />
            </span>
            <h2 className="text-ink mt-4 text-xl font-bold">Are You Sure You Want to Delete This Property?</h2>
            <p className="text-ink-muted mt-2 text-sm">Once deleted, this property listing cannot be recovered.</p>
            <div className="mt-6 flex gap-3">
              <Button
                variant="outline"
                onClick={() => setConfirmOpen(false)}
                disabled={deleting}
                className="text-ink h-12 flex-1 rounded-xl border-black/15 text-sm font-semibold"
              >
                Cancel
              </Button>
              <Button
                onClick={confirmDelete}
                disabled={deleting}
                className="h-12 flex-[1.3] rounded-xl bg-[#e05757] text-sm font-semibold text-white hover:bg-[#d24a4a]"
              >
                {deleting ? "Deleting..." : "Yes, Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
