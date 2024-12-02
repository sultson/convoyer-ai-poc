import { useEffect, useMemo, useState } from 'react';
import { vehicles } from '../config/vehicles';

interface Node {
  id: string;
  type: string;
  label?: string;
  metadata: {
    rank?: number;
    rankScore?: number;
  };
}

interface RankingCardProps {
  data?: Node[];
}

const RankingCard = ({ data }: RankingCardProps) => {
  const [rankings, setRankings] = useState<Node[]>([]);
  const getRankings = () => {
    if (!data) return [];

    // Get all vehicles with ranks
    const rankedVehicles = data
      .filter((node) => node.type === 'vehicle' && node.metadata?.rank)
      .map((vehicle) => {
        // Find associated observations for this vehicle


        const observations = data.filter(n => n.type === 'observation' && n.id.includes(vehicle.id))
        //highest confidence observation
        const orderedObservations = observations.filter(o => o.metadata.confidence).sort((a,b) => a.metadata.confidence - b.metadata.confidence)
        const orderedObservation = orderedObservations[0]
        const orderedObservationVehicle = vehicles.find(v => v.armorId === orderedObservation?.metadata?.armorId)?.name
        return {
          id: vehicle.id,
          label: orderedObservationVehicle || vehicle.label || vehicle.id,
          rank: vehicle.metadata.rank,
          rankScore: vehicle.metadata.rankScore,
          isOcluded: vehicle.metadata.isOcluded
        };
      })
      .sort((a, b) => (a.rank || 0) - (b.rank || 0));

    setRankings(rankedVehicles);
  }

  useEffect(() => {
    getRankings();
  }, [data]);


  if (!rankings) return null;


  return (
    <div className="absolute top-4 right-4 bg-gray-900 border border-gray-700 rounded-lg p-4 shadow-lg">
      <h3 className="text-lg font-semibold text-white mb-2">Ranking</h3>
      <div className="space-y-2">
        {Array.isArray(rankings) ? rankings.map((vehicle) => (
          <div 
            key={vehicle.id} 
            className="flex items-center justify-between gap-4 text-white"
          >
            <div className="flex items-center gap-2">
              <span className={`w-6 h-6 flex items-center justify-center rounded-full text-sm `}>
                {vehicle.rank}
              </span>
              <span
                className={`${vehicle.isOcluded ? 'bg-gray-400' : 'bg-teal-600'}  px-1 rounded-md`}
              >{vehicle.label}</span>
            </div>
            <span className="text-sm text-gray-400">
              Score: {vehicle.rankScore}
            </span>
          </div>
        )): null}
      </div>
    </div>
  );
};

export default RankingCard;
