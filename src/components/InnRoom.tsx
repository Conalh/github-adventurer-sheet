export function InnRoom() {
  return (
    <div className="inn-room" aria-hidden="true">
      <span className="inn-floorboards" />
      <span className="inn-central-rug"><i /></span>
      <span className="inn-wall inn-wall--north" />
      <span className="inn-wall inn-wall--west" />
      <span className="inn-wall inn-wall--east" />
      <span className="inn-table inn-table--left"><i /><b /><b /></span>
      <span className="inn-table inn-table--right"><i /><b /><b /></span>
      <span className="inn-counter"><i /><b /><b /><b /></span>
      <span className="inn-hearth"><i className="hearth-mantle" /><i className="hearth-fire" /></span>
      <span className="inn-scatter inn-scatter--left" />
      <span className="inn-scatter inn-scatter--right" />
    </div>
  );
}
