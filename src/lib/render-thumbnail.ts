import {
  THUMBNAIL_TEMPLATE,
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

function drawCornerAccents(ctx: CanvasRenderingContext2D) {
  const { width, height, colors } = THUMBNAIL_TEMPLATE;

  // Top-left navy + gold bands
  ctx.fillStyle = colors.navy;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(520, 0);
  ctx.lineTo(0, 340);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = colors.gold;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(280, 0);
  ctx.lineTo(0, 180);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = colors.navy;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(140, 0);
  ctx.lineTo(0, 95);
  ctx.closePath();
  ctx.fill();

  // Bottom-right mirror
  ctx.fillStyle = colors.navy;
  ctx.beginPath();
  ctx.moveTo(width, height);
  ctx.lineTo(width - 520, height);
  ctx.lineTo(width, height - 340);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = colors.gold;
  ctx.beginPath();
  ctx.moveTo(width, height);
  ctx.lineTo(width - 280, height);
  ctx.lineTo(width, height - 180);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = colors.navy;
  ctx.beginPath();
  ctx.moveTo(width, height);
  ctx.lineTo(width - 140, height);
  ctx.lineTo(width, height - 95);
  ctx.closePath();
  ctx.fill();
}

function drawHeader(ctx: CanvasRenderingContext2D) {
  const { width, colors, header } = THUMBNAIL_TEMPLATE;
  ctx.fillStyle = colors.navy;
  ctx.font = `${header.fontWeight} ${header.fontSize}px ${header.fontFamily}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(header.title, width / 2, header.y);

  const metrics = ctx.measureText(header.title);
  const textWidth = metrics.width;
  const lineY = header.y;
  const leftEnd = width / 2 - textWidth / 2 - header.lineGap;
  const rightStart = width / 2 + textWidth / 2 + header.lineGap;

  ctx.strokeStyle = colors.gold;
  ctx.lineWidth = 5;
  ctx.lineCap = "round";

  ctx.beginPath();
  ctx.moveTo(leftEnd - header.lineWidth, lineY);
  ctx.lineTo(leftEnd, lineY);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(rightStart, lineY);
  ctx.lineTo(rightStart + header.lineWidth, lineY);
  ctx.stroke();
}

async function drawMemberCard(
  ctx: CanvasRenderingContext2D,
  member: ThumbnailMember,
  x: number,
  y: number,
) {
  const { colors, card } = THUMBNAIL_TEMPLATE;
  const totalHeight = card.photoHeight + card.bodyHeight;

  // Card shadow
  ctx.save();
  ctx.shadowColor = "rgba(11, 44, 92, 0.18)";
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 10;
  ctx.fillStyle = colors.card;
  drawRoundedRect(ctx, x, y, card.width, totalHeight, card.radius);
  ctx.fill();
  ctx.restore();

  // Photo area
  ctx.save();
  drawRoundedRect(ctx, x, y, card.width, card.photoHeight, card.radius);
  ctx.clip();
  // Square bottom of photo clip by filling rect after rounded top only:
  ctx.beginPath();
  ctx.rect(x, y + card.radius, card.width, card.photoHeight - card.radius);
  ctx.clip();

  if (member.photoUrl) {
    try {
      const img = await loadImage(member.photoUrl);
      drawCoverImage(ctx, img, x, y, card.width, card.photoHeight, member.photoFit);
    } catch {
      ctx.fillStyle = colors.mutedPhoto;
      ctx.fillRect(x, y, card.width, card.photoHeight);
    }
  } else {
    ctx.fillStyle = colors.mutedPhoto;
    ctx.fillRect(x, y, card.width, card.photoHeight);
    ctx.fillStyle = colors.navy;
    ctx.font = `600 28px ${THUMBNAIL_TEMPLATE.header.fontFamily}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Add photo", x + card.width / 2, y + card.photoHeight / 2);
  }
  ctx.restore();

  // Re-draw top rounded photo corners over image edge
  ctx.save();
  drawRoundedRect(ctx, x, y, card.width, totalHeight, card.radius);
  ctx.strokeStyle = "rgba(11,44,92,0.08)";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();

  const bodyTop = y + card.photoHeight;
  const centerX = x + card.width / 2;

  ctx.fillStyle = colors.text;
  ctx.font = `700 ${card.nameSize}px ${THUMBNAIL_TEMPLATE.header.fontFamily}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const name = member.name.trim() || "Name";
  ctx.fillText(name, centerX, bodyTop + card.nameYOffset, card.width - 28);

  ctx.strokeStyle = colors.gold;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(centerX - 34, bodyTop + card.dividerYOffset);
  ctx.lineTo(centerX + 34, bodyTop + card.dividerYOffset);
  ctx.stroke();

  ctx.fillStyle = colors.text;
  ctx.font = `500 ${card.titleSize}px ${THUMBNAIL_TEMPLATE.header.fontFamily}`;
  const title = member.title.trim() || "Job title";
  ctx.fillText(title, centerX, bodyTop + card.titleYOffset, card.width - 28);
}

export async function renderTeamThumbnail(
  members: ThumbnailMember[],
): Promise<HTMLCanvasElement> {
  const { width, height, colors, card } = THUMBNAIL_TEMPLATE;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not create thumbnail canvas.");

  // Background
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "#F7F8FA");
  gradient.addColorStop(0.5, colors.background);
  gradient.addColorStop(1, "#EEF1F6");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Soft architectural-ish pattern
  ctx.save();
  ctx.globalAlpha = 0.04;
  ctx.strokeStyle = colors.navy;
  ctx.lineWidth = 2;
  for (let i = -height; i < width + height; i += 48) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + height, height);
    ctx.stroke();
  }
  ctx.restore();

  drawCornerAccents(ctx);
  drawHeader(ctx);

  const active = members.slice(0, THUMBNAIL_TEMPLATE.maxMembers);
  const count = Math.max(1, active.length);
  const totalWidth = count * card.width + (count - 1) * card.gap;
  const startX = (width - totalWidth) / 2;
  const cardY = 250;

  for (let i = 0; i < count; i += 1) {
    const member = active[i] ?? {
      id: `empty-${i}`,
      photoUrl: null,
      name: "",
      title: "",
    };
    await drawMemberCard(ctx, member, startX + i * (card.width + card.gap), cardY);
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
