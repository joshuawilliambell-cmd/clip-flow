import {
  THUMBNAIL_TEMPLATE,
  defaultPhotoFit,
  type ThumbnailMember,
} from "@/lib/thumbnail-template";

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load image."));
    img.src = src;
  });
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function drawCoverImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
  fit?: { scale: number; focusX: number; focusY: number },
) {
  const zoom = Math.max(
    THUMBNAIL_TEMPLATE.photoFit.minScale,
    Math.min(
      THUMBNAIL_TEMPLATE.photoFit.maxScale,
      fit?.scale ?? THUMBNAIL_TEMPLATE.photoFit.defaultScale,
    ),
  );
  const focusX = Math.min(1, Math.max(0, fit?.focusX ?? 0.5));
  const focusY = Math.min(1, Math.max(0, fit?.focusY ?? 0.28));
  const baseScale = Math.max(w / img.width, h / img.height);
  const scale = baseScale * zoom;
  const sw = Math.min(img.width, w / scale);
  const sh = Math.min(img.height, h / scale);
  let sx = focusX * img.width - sw / 2;
  let sy = focusY * img.height - sh / 2;
  sx = Math.max(0, Math.min(img.width - sw, sx));
  sy = Math.max(0, Math.min(img.height - sh, sy));
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

/** Soft cream field — matches the in-app silhouette mockup. */
function drawBackground(ctx: CanvasRenderingContext2D) {
  const { width, height, colors } = THUMBNAIL_TEMPLATE;
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, colors.background);
  gradient.addColorStop(1, colors.backgroundDeep);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}

/** Gradient title bar with white title text (mockup style). */
function drawHeaderBar(ctx: CanvasRenderingContext2D) {
  const { width, colors, header } = THUMBNAIL_TEMPLATE;
  const h = header.barHeight;
  const gradient = ctx.createLinearGradient(0, 0, width, 0);
  gradient.addColorStop(0, colors.red);
  gradient.addColorStop(0.55, colors.orange);
  gradient.addColorStop(1, colors.yellow);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, h);

  ctx.fillStyle = "#FFFFFF";
  ctx.font = `${header.fontWeight} ${header.fontSize}px ${header.fontFamily}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(header.title, width / 2, h / 2);
}

/** Head-and-shoulders placeholder when a slot has no photo yet. */
function drawSilhouettePlaceholder(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  const { colors } = THUMBNAIL_TEMPLATE;
  ctx.fillStyle = colors.mutedPhoto;
  ctx.fillRect(x, y, w, h);

  const cx = x + w / 2;
  const headR = w * 0.18;
  const headCy = y + h * 0.32;
  ctx.fillStyle = colors.silhouette;
  ctx.beginPath();
  ctx.arc(cx, headCy, headR, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(x + w * 0.1, y + h);
  ctx.bezierCurveTo(
    x + w * 0.1,
    y + h * 0.58,
    x + w * 0.28,
    y + h * 0.52,
    cx,
    y + h * 0.52,
  );
  ctx.bezierCurveTo(
    x + w * 0.72,
    y + h * 0.52,
    x + w * 0.9,
    y + h * 0.58,
    x + w * 0.9,
    y + h,
  );
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = colors.silhouetteMid;
  ctx.beginPath();
  ctx.moveTo(cx - w * 0.08, y + h * 0.54);
  ctx.lineTo(cx, y + h * 0.64);
  ctx.lineTo(cx + w * 0.08, y + h * 0.54);
  ctx.closePath();
  ctx.fill();
}

async function drawMemberCard(
  ctx: CanvasRenderingContext2D,
  member: ThumbnailMember,
  x: number,
  y: number,
) {
  const { colors, card, header } = THUMBNAIL_TEMPLATE;
  const totalHeight = card.photoHeight + card.bodyHeight;

  // Soft shadow
  ctx.save();
  ctx.shadowColor = "rgba(26, 26, 26, 0.14)";
  ctx.shadowBlur = 22;
  ctx.shadowOffsetY = 8;
  ctx.fillStyle = colors.card;
  drawRoundedRect(ctx, x, y, card.width, totalHeight, card.radius);
  ctx.fill();
  ctx.restore();

  // Photo area
  ctx.save();
  drawRoundedRect(ctx, x, y, card.width, card.photoHeight, card.radius);
  ctx.clip();
  ctx.beginPath();
  ctx.rect(x, y + card.radius, card.width, card.photoHeight - card.radius);
  ctx.clip();

  if (member.photoUrl) {
    try {
      const img = await loadImage(member.photoUrl);
      drawCoverImage(ctx, img, x, y, card.width, card.photoHeight, member.photoFit);
    } catch {
      drawSilhouettePlaceholder(ctx, x, y, card.width, card.photoHeight);
    }
  } else {
    drawSilhouettePlaceholder(ctx, x, y, card.width, card.photoHeight);
  }
  ctx.restore();

  // Ink border (mockup style — not the old red frame)
  ctx.save();
  drawRoundedRect(ctx, x, y, card.width, totalHeight, card.radius);
  ctx.strokeStyle = colors.ink;
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.restore();

  const bodyTop = y + card.photoHeight;
  const centerX = x + card.width / 2;

  // White name plate already filled by card background
  ctx.fillStyle = colors.text;
  ctx.font = `800 ${card.nameSize}px ${header.fontFamily}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const name = member.name.trim() || "Name";
  ctx.fillText(name, centerX, bodyTop + card.nameYOffset, card.width - 28);

  ctx.strokeStyle = "rgba(26, 26, 26, 0.28)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(centerX - 34, bodyTop + card.dividerYOffset);
  ctx.lineTo(centerX + 34, bodyTop + card.dividerYOffset);
  ctx.stroke();

  ctx.fillStyle = colors.muted;
  ctx.font = `600 ${card.titleSize}px ${header.fontFamily}`;
  const title = member.title.trim() || "Job title";
  ctx.fillText(title, centerX, bodyTop + card.titleYOffset, card.width - 28);
}

export async function renderTeamThumbnail(
  members: ThumbnailMember[],
): Promise<HTMLCanvasElement> {
  const { width, height, colors, card, header } = THUMBNAIL_TEMPLATE;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not create thumbnail canvas.");

  drawBackground(ctx);
  drawHeaderBar(ctx);

  // Outer frame like the mockup card
  ctx.strokeStyle = colors.ink;
  ctx.lineWidth = 6;
  ctx.strokeRect(3, 3, width - 6, height - 6);

  const active = members.slice(0, THUMBNAIL_TEMPLATE.maxMembers);
  const count = active.length;
  if (count > 0) {
    const totalWidth = count * card.width + (count - 1) * card.gap;
    const startX = (width - totalWidth) / 2;
    const cardY = header.barHeight + 72;

    for (let i = 0; i < count; i += 1) {
      const member = active[i] ?? {
        id: `empty-${i}`,
        photoUrl: null,
        name: "",
        title: "",
        photoFit: defaultPhotoFit(),
      };
      await drawMemberCard(
        ctx,
        member,
        startX + i * (card.width + card.gap),
        cardY,
      );
    }
  }

  return canvas;
}

export async function exportTeamThumbnailPng(
  members: ThumbnailMember[],
): Promise<Blob> {
  const canvas = await renderTeamThumbnail(members);
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/png"),
  );
  if (!blob) throw new Error("Could not export thumbnail PNG.");
  return blob;
}
