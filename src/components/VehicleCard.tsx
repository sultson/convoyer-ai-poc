const VehicleCard = ({ data }) => {
  return (
    <div className="max-w-sm bg-gray-800 shadow-lg rounded-lg overflow-hidden border border-gray-700">
      <div className="p-4">
        <h2 className="text-lg font-bold text-gray-100">{data.name}</h2>
        <p className="text-sm text-gray-400">{data.year}</p>
        <p className="text-sm text-blue-400 mt-4">{data.title}</p>
      </div>
    </div>
  );
};

export default VehicleCard;
