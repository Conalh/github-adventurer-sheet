export function InnRoom() {
  return (
    <div className="inn-room" aria-hidden="true">
      <span className="inn-floorboards">
        <i className="floor-knot floor-knot--one" />
        <i className="floor-knot floor-knot--two" />
        <i className="floor-nails floor-nails--one" />
        <i className="floor-nails floor-nails--two" />
      </span>
      <span className="inn-central-rug"><i /></span>
      <InnWallFrame />
      <InnTable side="left" />
      <InnTable side="right" />
      <InnCounter />
      <InnHearth />
      <span className="inn-room-detail inn-room-detail--mug" />
      <span className="inn-room-detail inn-room-detail--coins" />
    </div>
  );
}

function InnWallFrame() {
  return (
    <svg className="inn-wall-frame" viewBox="0 0 1000 520" preserveAspectRatio="none" focusable="false">
      <path className="inn-wall-plaster" d="M0 0h1000v48H0z" />
      <path className="inn-wall-timber" d="M0 0h1000v22H0zM0 0h38v520H0zM962 0h38v520h-38z" />
      <path className="inn-wall-highlight" d="M8 7h984M8 7v505M970 7v505" />
      <path className="inn-wall-joints" d="M205 0v22M500 0v22M795 0v22M0 132h38M962 132h38M0 344h38M962 344h38" />
      <g className="inn-wall-pegs"><circle cx="205" cy="12" r="5" /><circle cx="500" cy="12" r="5" /><circle cx="795" cy="12" r="5" /></g>
    </svg>
  );
}

function InnTable({ side }: { side: "left" | "right" }) {
  return (
    <svg className={`inn-furniture inn-table inn-table--${side}`} viewBox="0 0 240 170" focusable="false">
      <ellipse className="inn-contact-shadow" cx="126" cy="145" rx="104" ry="16" />
      <g className="inn-table-legs"><rect x="31" y="92" width="18" height="29" /><rect x="191" y="92" width="18" height="29" /></g>
      <path className="inn-table-top" d="M18 22h204l-11 88H29z" />
      <path className="inn-table-bevel" d="M18 22h204l-4 13H22zM29 110h182l-5 9H34z" />
      <path className="inn-table-planks" d="M63 26l-6 80M108 26l-2 80M153 26l2 80M198 26l6 80" />
      <path className="inn-wood-knot" d="M82 66q10-9 20 0-10 10-20 0z" />
      <g className="inn-bench">
        <path d="M43 128h154l8 19H35z" />
        <rect x="50" y="146" width="14" height="12" /><rect x="176" y="146" width="14" height="12" />
        <path className="inn-bench-highlight" d="M46 132h148" />
      </g>
    </svg>
  );
}

function InnCounter() {
  return (
    <svg className="inn-furniture inn-counter" viewBox="0 0 420 120" focusable="false">
      <path className="inn-contact-shadow" d="M18 100h384l-16 14H34z" />
      <path className="inn-counter-front" d="M24 34h372v68H24z" />
      <path className="inn-counter-top" d="M10 18h400l-14 28H24z" />
      <path className="inn-counter-highlight" d="M18 23h384" />
      <path className="inn-counter-panels" d="M34 52v42M105 52v42M176 52v42M247 52v42M318 52v42M386 52v42" />
      <path className="inn-counter-posts" d="M24 40h14v62H24zM382 40h14v62h-14z" />
    </svg>
  );
}

function InnHearth() {
  return (
    <svg className="inn-furniture inn-hearth" viewBox="0 0 120 150" focusable="false">
      <ellipse className="inn-contact-shadow" cx="63" cy="137" rx="52" ry="10" />
      <g className="inn-hearth-stones">
        <path d="M12 28h96v108H12z" />
        <path d="M17 34h26v22H17zM46 34h29v22H46zM78 34h25v22H78z" />
        <path d="M17 59h22v27H17zM82 59h21v27H82zM17 89h22v38H17zM82 89h21v38H82z" />
      </g>
      <path className="inn-hearth-mantle" d="M5 18h110v19H5z" />
      <path className="inn-hearth-mantle-highlight" d="M10 22h100" />
      <path className="inn-firebox" d="M39 128V79q21-35 42 0v49z" />
      <g className="inn-fire-logs"><path d="m43 120 34-13M45 107l31 14" /></g>
      <path className="inn-flame inn-flame--outer" d="M60 116q-20-18 1-47 21 28-1 47z" />
      <path className="inn-flame inn-flame--inner" d="M60 112q-9-10 1-27 10 16-1 27z" />
    </svg>
  );
}
