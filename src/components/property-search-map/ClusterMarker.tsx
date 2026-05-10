"use client";

function clusterSvg(count: number): string {
  const r = count > 15 ? 52 : 44;
  const fill = count > 25 ? "#0c4a6e" : "#1864F5";
  const pr = r + 8;
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${pr * 2}" height="${pr * 2}" viewBox="0 0 ${pr * 2} ${pr * 2}">
  <circle cx="${pr}" cy="${pr}" r="${pr * 0.85}" fill="${fill}" opacity="0.22"/>
  <circle cx="${pr}" cy="${pr}" r="${pr * 0.65}" fill="${fill}" opacity="0.45"/>
  <circle cx="${pr}" cy="${pr}" r="${r * 0.5}" fill="${fill}"/>
  <text x="${pr}" y="${pr}" text-anchor="middle" dominant-baseline="central"
    fill="#fff" font-size="${count > 99 ? 16 : 18}" font-family="system-ui,sans-serif" font-weight="700">${count}</text>
</svg>`.trim();
}

/** Renderer de clusters (@googlemaps/markerclusterer). */
export function createAuctionClusterRenderer() {
  return {
    render({
      count,
      position,
    }: {
      count: number;
      position: google.maps.LatLng;
    }) {
      const svg = clusterSvg(count);
      const url = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
      const size = Math.round(44 + Math.log10(count + 1) * 8);
      return new google.maps.Marker({
        position,
        icon: {
          url,
          scaledSize: new google.maps.Size(size, size),
          anchor: new google.maps.Point(size / 2, size / 2),
        },
        zIndex: Number(google.maps.Marker.MAX_ZINDEX) + count,
      });
    },
  };
}
