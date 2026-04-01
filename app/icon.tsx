import { ImageResponse } from "next/og";

export const size = {
  width: 32,
  height: 32,
};
export const contentType = "image/png";

/** Vector-only favicon: ImageResponse cannot load /logo.png from public reliably on Edge; missing file caused ERR_EMPTY_RESPONSE. */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#1581BF",
          borderRadius: 8,
        }}
      >
        <div
          style={{
            width: 14,
            height: 14,
            background: "white",
            borderRadius: 4,
          }}
        />
      </div>
    ),
    {
      ...size,
      headers: {
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    }
  );
}
