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

/** Corner bands echoing the Love's heart stripes: red → yellow → orange. */
function drawCornerAccents(ctx: CanvasRenderingContext2D) {
  const { width, height, colors } = THUMBNAIL_TEMPLATE;

  // Top-left: red base, yellow, orange (like heart motion stripes)
  ctx.fillStyle = colors.red;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(540, 0);
  ctx.lineTo(0, 360);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = colors.yellow;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(300, 0);
  ctx.lineTo(0, 200);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = colors.orange;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(160, 0);
  ctx.lineTo(0, 110);
  ctx.closePath();
  ctx.fill();

  // Thin ink edges for logo-like definition
  ctx.strokeStyle = colors.ink;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(540, 0);
  ctx.lineTo(0, 360);
  ctx.stroke();

  // Bottom-right mirror
  ctx.fillStyle = colors.red;
  ctx.beginPath();
  ctx.moveTo(width, height);
  ctx.lineTo(width - 540, height);
  ctx.lineTo(width, height - 360);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = colors.yellow;
  ctx.beginPath();
  ctx.moveTo(width, height);
  ctx.lineTo(width - 300, height);
  ctx.lineTo(width, height - 200);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = colors.orange;
  ctx.beginPath();
  ctx.moveTo(width, height);
  ctx.lineTo(width - 160, height);
  ctx.lineTo(width, height - 110);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(width - 540, height);
  ctx.lineTo(width, height - 360);
  ctx.stroke();
}

function drawHeader(ctx: CanvasRenderingContext2D) {
  const { width, colors, header } = THUMBNAIL_TEMPLATE;
  ctx.fillStyle = colors.ink;
  ctx.font = `${header.fontWeight} ${header.fontSize}px ${header.fontFamily}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(header.title, width / 2, header.y);

  // Small Love's heart accent over the word
  const metrics = ctx.measureText(header.title);
  const textWidth = metrics.width;
  const heartX = width / 2 + textWidth / 2 - 18;
  const heartY = header.y - header.fontSize * 0.42;
  drawMiniHeart(ctx, heartX, heartY, 22);

  const lineY = header.y;
  const leftEnd = width / 2 - textWidth / 2 - header.lineGap;
  const rightStart = width / 2 + textWidth / 2 + header.lineGap;

  // Stripe lines: yellow then orange then red segments
  drawStripeLine(ctx, leftEnd - header.lineWidth, leftEnd, lineY);
  drawStripeLine(ctx, rightStart, rightStart + header.lineWidth, lineY);
}

function drawStripeLine(
  ctx: CanvasRenderingContext2D,
  x1: number,
  x2: number,
  y: number,
) {
  const { colors } = THUMBNAIL_TEMPLATE;
  const mid1 = x1 + (x2 - x1) * 0.33;
  const mid2 = x1 + (x2 - x1) * 0.66;
  ctx.lineWidth = 6;
  ctx.lineCap = "round";

  ctx.strokeStyle = colors.yellow;
  ctx.beginPath();
  ctx.moveTo(x1, y);
  ctx.lineTo(mid1, y);
  ctx.stroke();

  ctx.strokeStyle = colors.orange;
  ctx.beginPath();
  ctx.moveTo(mid1, y);
  ctx.lineTo(mid2, y);
  ctx.stroke();

  ctx.strokeStyle = colors.red;
  ctx.beginPath();
  ctx.moveTo(mid2, y);
  ctx.lineTo(x2, y);
  ctx.stroke();
}

function drawMiniHeart(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
) {
  const { colors } = THUMBNAIL_TEMPLATE;
  ctx.save();
  ctx.fillStyle = colors.red;
  ctx.beginPath();
  const topY = cy - size * 0.25;
  ctx.moveTo(cx, cy + size * 0.35);
  ctx.bezierCurveTo(
    cx - size * 0.7,
    cy + size * 0.05,
    cx - size * 0.55,
    topY - size * 0.35,
    cx,
    topY,
  );
  ctx.bezierCurveTo(
    cx + size * 0.55,
    topY - size * 0.35,
    cx + size * 0.7,
    cy + size * 0.05,
    cx,
    cy + size * 0.35,
  );
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = colors.ink;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
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
  ctx.shadowColor = "rgba(237, 32, 36, 0.18)";
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
    ctx.fillStyle = colors.red;
    ctx.font = `700 28px ${THUMBNAIL_TEMPLATE.header.fontFamily}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Add photo", x + card.width / 2, y + card.photoHeight / 2);
  }
  ctx.restore();

  // Card border in Love's red
  ctx.save();
  drawRoundedRect(ctx, x, y, card.width, totalHeight, card.radius);
  ctx.strokeStyle = colors.red;
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.restore();

  // Thin yellow/orange accent under photo
  ctx.fillStyle = colors.yellow;
  ctx.fillRect(x + 2, y + card.photoHeight - 6, card.width - 4, 3);
  ctx.fillStyle = colors.orange;
  ctx.fillRect(x + 2, y + card.photoHeight - 3, card.width - 4, 3);

  const bodyTop = y + card.photoHeight;
  const centerX = x + card.width / 2;

  ctx.fillStyle = colors.text;
  ctx.font = `800 ${card.nameSize}px ${THUMBNAIL_TEMPLATE.header.fontFamily}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const name = member.name.trim() || "Name";
  ctx.fillText(name, centerX, bodyTop + card.nameYOffset, card.width - 28);

  ctx.strokeStyle = colors.red;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(centerX - 34, bodyTop + card.dividerYOffset);
  ctx.lineTo(centerX + 34, bodyTop + card.dividerYOffset);
  ctx.stroke();

  ctx.fillStyle = colors.text;
  ctx.font = `600 ${card.titleSize}px ${THUMBNAIL_TEMPLATE.header.fontFamily}`;
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

  // Warm Love's yellow field
  const gradient = ctx.createRadialGradient(
    width * 0.5,
    height * 0.4,
    80,
    width * 0.5,
    height * 0.5,
    width * 0.75,
  );
  gradient.addColorStop(0, colors.yellowBright);
  gradient.addColorStop(0.55, colors.background);
  gradient.addColorStop(1, colors.backgroundDeep);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Soft diagonal texture
  ctx.save();
  ctx.globalAlpha = 0.05;
  ctx.strokeStyle = colors.red;
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
  const count = active.length;
  if (count > 0) {
    const totalWidth = count * card.width + (count - 1) * card.gap;
    const startX = (width - totalWidth) / 2;
    const cardY = 250;

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
