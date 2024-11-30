const MissionCard = ({suggestNextActions}) => {
  // Sample data object
  const sampleData = {
    droneId: "DRN-2024-001",
    droneModel: "Mavic Pro 3",
    droneStatus: "active",
    lat: 37.7749,
    lon: -122.4194,
    address: "123 Market Street, San Francisco, CA 94105"
  };

  return (
    <div className="max-w-sm bg-gray-800 shadow-lg rounded-lg overflow-hidden border border-gray-700">
      <div className="p-4">
        <div className="flex justify-between items-start mb-3">
          <h2 className="text-lg font-bold text-gray-100">Drone #{sampleData.droneId}</h2>
          <span className={`px-2 py-1 rounded text-xs ${
            sampleData.droneStatus === 'active' ? 'bg-green-500' : 
            sampleData.droneStatus === 'inactive' ? 'bg-gray-500' : 'bg-yellow-500'
          }`}>
            {sampleData.droneStatus}
          </span>
        </div>
        
        <p className="text-sm text-gray-400 mb-2">Model: {sampleData.droneModel}</p>
        
        <div className="mt-4 pt-4 border-t border-gray-700">
          <p className="text-sm text-gray-400">
            <span className="font-semibold">Location: </span>
            {sampleData.lat}°, {sampleData.lon}°
          </p>
          <p className="text-sm text-gray-400 mt-2">
            <span className="font-semibold">Address: </span>
            {sampleData.address}
          </p>
        </div>

        {suggestNextActions && (
        <div className="mt-4 relative rounded-lg p-[1px] bg-gray-700">
          <div className="bg-gray-800 rounded-lg p-3">
            <h3 className="text-sm font-semibold text-gray-300 mb-3">Suggested Next Actions</h3>
            <div className="flex flex-col gap-2">
              <button className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md text-sm text-gray-200 transition-colors">
                Leave Site
              </button>
              <button className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md text-sm text-gray-200 transition-colors">
                Map Vehicle 1 left side
              </button>
              <button className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md text-sm text-gray-200 transition-colors">
                Map Vehicle 3 top-down
              </button>
            </div>
          </div>
        </div>
        )}
      </div>
    </div>
  );
};

export default MissionCard;
