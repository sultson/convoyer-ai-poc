import { useState, useEffect, useRef } from "react";
import * as d3 from "d3";
import { vehicles } from "./config/vehicles";
import VehicleCard from "./components/VehicleCard";
import MissionCard from "./components/MissionCard";

const App = () => {
  // Initial JSON Data
  const initialData = {
    nodes: [
      {
        id: "Vehicle 1",
        type: "vehicle",
        metadata: {
          Capacity: "5000L",
          Location: "Site A",
          Status: "Active",
        },
      },
      {
        id: "Vehicle 2",
        type: "vehicle",
        metadata: {
          Capacity: "3000L",
          Location: "Site B",
          Status: "Maintenance",
        },
      },
      {
        id: "Vehicle 3",
        type: "vehicle",
        metadata: {
          Capacity: "4000L",
          Location: "Site C",
          Status: "Inactive",
        },
      },
    ],
    links: [],
  };

  // State for JSON Data
  const [jsonData, setJsonData] = useState(initialData);
  const [isSimulating, setIsSimulating] = useState(false);
  const [suggestNextActions, setSuggestNextActions] = useState(false);
  // Refs for SVG and Tooltip
  const svgRef = useRef(null);
  const tooltipRef = useRef(null);

  // Effect to render graph whenever jsonData changes
  useEffect(() => {
    renderGraph();
    // Cleanup on unmount
    return () => {
      d3.select(svgRef.current).selectAll("*").remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jsonData]);

  // Effect to handle window resize
  useEffect(() => {
    const handleResize = () => {
      renderGraph();
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jsonData]);

  // Function to render the graph using D3
  const renderGraph = () => {
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // Clear previous contents

    const container = svgRef.current.parentElement;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Set SVG dimensions
    svg
      .attr('width', '100%')
      .attr('height', '100%')
      .style('overflow', 'visible');

    // Initialize simulation
    const simulation = d3
      .forceSimulation(jsonData.nodes)
      .force(
        'link',
        d3
          .forceLink(jsonData.links)
          .id((d) => d.id)
          .distance(120)
      )
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force(
        'collision',
        d3.forceCollide().radius((d) => (d.type === 'vehicle' ? 30 : 25))
      )
      .force('x', d3.forceX(width / 2).strength(0.1))
      .force('y', d3.forceY(height / 2).strength(0.1));

    // Define arrow markers for links
    svg
      .append('defs')
      .selectAll('marker')
      .data(['end'])
      .enter()
      .append('marker')
      .attr('id', (d) => d)
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 25)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#999');

    // Draw links
    const link = svg
      .append('g')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.6)
      .selectAll('line')
      .data(jsonData.links)
      .enter()
      .append('line')
      .attr('stroke-width', 2)
      .attr('marker-end', 'url(#end)');

    // Draw nodes
    const node = svg
      .append('g')
      .selectAll('.node')
      .data(jsonData.nodes)
      .enter()
      .append('g')
      .attr('class', 'node')
      .call(drag(simulation));

    // Define shapes based on node type and apply styles
    node.each(function (d) {
      if (d.type === 'vehicle') {
        d3.select(this)
          .append('circle')
          .attr('r', 40)
          .attr('fill', '#69b3a2')
          .attr('stroke', '#333')
          .attr('stroke-width', 2);
      } else if (d.type === 'observation') {
        d3.select(this)
          .append('rect')
          .attr('x', -15)
          .attr('y', -15)
          .attr('width', 100)
          .attr('height', 30)
          .attr('fill', '#ffab00')
          .attr('stroke', (d) => (d.metadata?.enriched ? '#3b82f6' : '#333'))
          .attr('stroke-width', (d) => (d.metadata?.enriched ? 4 : 2));
      }
    });

    // Add labels
    node
      .append('text')
      .attr('dy', (d) => (d.type === 'vehicle' ? 6 : 4))
      .attr('text-anchor', 'middle')
      .text((d) => d.id)
      .style('pointer-events', 'none')
      .style('font-size', '12px')
      .style('font-family', 'monospace')
      .style('font-weight', 'bold')
      .style('fill', (d) => (d.type === 'vehicle' ? '#fff' : '#fff'));


      if (d.type === 'observation') {
        node.
      }

    // Add rank labels to vehicles
    node
      .filter((d) => d.type === 'vehicle' && d.metadata.rank)
      .append('text')
      .attr('dy', 20)
      .attr('text-anchor', 'middle')
      .text((d) => `Rank: ${d.metadata.rank}`)
      .style('pointer-events', 'none')
      .style('font-size', '10px')
      .style('fill', '#fff');

    // Tooltip setup
    const tooltip = d3.select(tooltipRef.current);

    node
      .on('mouseover', (event, d) => {
        let content = `<strong>ID:</strong> ${d.id}<br/>`;
        if (d.metadata) {
          for (const [key, value] of Object.entries(d.metadata)) {
            content += `<strong>${key}:</strong> ${value}<br/>`;
          }
        }
        tooltip
          .html(content)
          .style('left', event.pageX + 15 + 'px')
          .style('top', event.pageY + 15 + 'px')
          .transition()
          .duration(200)
          .style('opacity', 0.9);
      })
      .on('mousemove', (event) => {
        tooltip
          .style('left', event.pageX + 15 + 'px')
          .style('top', event.pageY + 15 + 'px');
      })
      .on('mouseout', () => {
        tooltip.transition().duration(200).style('opacity', 0);
      });

    // Simulation tick
    simulation.on('tick', () => {
      link
        .attr('x1', (d) => d.source.x)
        .attr('y1', (d) => d.source.y)
        .attr('x2', (d) => d.target.x)
        .attr('y2', (d) => d.target.y);

      node.attr('transform', (d) => `translate(${d.x},${d.y})`);

      // Boundary Constraints
      jsonData.nodes.forEach((d) => {
        const padding = 50; // Increased padding for better visibility
        d.x = Math.max(padding, Math.min(width - padding, d.x));
        d.y = Math.max(padding, Math.min(height - padding, d.y));
      });
    });

    // Restart the simulation
    simulation.alpha(1).restart();
  }
  // Drag functionality
  const dragFunction = (simulation) => {
    function dragstarted(event, d) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event, d) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event, d) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    return d3
      .drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended);
  };

  // Function to handle graph dragging
  const drag = (simulation) => {
    return dragFunction(simulation);
  };

  // Function to update the graph based on JSON data
  const updateGraph = () => {
    try {
      const parsedData = JSON.parse(jsonDataString);
      setJsonData(parsedData);
    } catch (err) {
      alert("Invalid JSON: " + err.message);
    }
  };

  // State for textarea value
  const [jsonDataString, setJsonDataString] = useState(
    JSON.stringify(initialData, null, 4)
  );

  // Effect to synchronize jsonData and textarea
  useEffect(() => {
    setJsonDataString(JSON.stringify(jsonData, null, 4));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jsonData]);

  // Function to run the simulation
  const runSimulation = async () => {
    if (isSimulating) return; // Prevent multiple simulations
    setIsSimulating(true);

    try {
      // Step 1: Display initial nodes (3 Vehicles)
      const step1Data = {
        nodes: [
          {
            id: 'Vehicle 1',
            type: 'vehicle',
            metadata: {
              Capacity: '5000L',
              Location: 'Site A',
              Status: 'Active',
            },
          },
          {
            id: 'Vehicle 2',
            type: 'vehicle',
            metadata: {
              Capacity: '3000L',
              Location: 'Site B',
              Status: 'Maintenance',
            },
          },
          {
            id: 'Vehicle 3',
            type: 'vehicle',
            metadata: {
              Capacity: '4000L',
              Location: 'Site C',
              Status: 'Inactive',
            },
          },
        ],
        links: [],
      };
      setJsonData(step1Data);
      await sleep(2000); // Wait 2 seconds

      // Step 2: Add 3 Observation Nodes
      const step2Nodes = [...step1Data.nodes];
      for (let i = 1; i <= 3; i++) {
        step2Nodes.push({
          id: `Observation ${i}`,
          type: 'observation',
          metadata: { ObservationID: `Obs-${i}` },
        });
      }
      const step2Data = {
        nodes: step2Nodes,
        links: [],
      };
      setJsonData(step2Data);
      await sleep(2000); // Wait 2 seconds

      // Step 3: Add 5 more Observation Nodes (total 8)
      const step3Nodes = [...step2Data.nodes];
      for (let i = 4; i <= 8; i++) {
        step3Nodes.push({
          id: `Observation ${i}`,
          type: 'observation',
          metadata: { ObservationID: `Obs-${i}` },
        });
      }
      const step3Data = {
        nodes: step3Nodes,
        links: [],
      };
      setJsonData(step3Data);
      await sleep(2000); // Wait 2 seconds

      // Step 4: Enrich 40% of Observation Nodes
      const observations = step3Data.nodes.filter(
        (node) => node.type === 'observation'
      );
      const numberToEnrich = Math.ceil(observations.length * 0.4);
      const shuffled = observations.sort(() => 0.5 - Math.random());
      const enrichedObservations = shuffled.slice(0, numberToEnrich);

      const step4Nodes = step3Data.nodes.map((node) => {
        if (enrichedObservations.find((obs) => obs.id === node.id)) {
          return {
            ...node,
            metadata: { ...node.metadata, enriched: true },
          };
        }
        return node;
      });

      const step4Data = {
        nodes: step4Nodes,
        links: [],
      };
      setJsonData(step4Data);
      await sleep(2000); // Wait 2 seconds

      // Step 5: Link enriched Observations back to Vehicles
      const enrichedObs = step4Data.nodes.filter(
        (node) => node.type === 'observation' && node.metadata.enriched
      );

      const step5Links = enrichedObs.map((obs) => {
        // Randomly assign to one Vehicle
        const randomVehicle =
          step1Data.nodes[
            Math.floor(Math.random() * step1Data.nodes.length)
          ];
        return { source: randomVehicle.id, target: obs.id };
      });

      const step5Data = {
        nodes: step4Data.nodes,
        links: step5Links,
      };
      setJsonData(step5Data);
      await sleep(2000); // Wait 2 seconds

      // Step 6: Assign random ranks to Vehicles
      const shuffledVehicles = [...step1Data.nodes].sort(() => 0.5 - Math.random());
      const ranks = [1, 2, 3];
      const step6Nodes = step5Data.nodes.map((node) => {
        if (node.type === 'vehicle') {
          const rank = ranks.shift(); // Assign rank 1 to 3
          return {
            ...node,
            metadata: { ...node.metadata, rank },
          };
        }
        return node;
      });

      const step6Data = {
        nodes: step6Nodes,
        links: step5Data.links,
      };
      setJsonData(step6Data);
      await sleep(2000); // Wait 2 seconds
      setSuggestNextActions(true);
      // Final Step: Optionally, you can add more steps or conclude the simulation
    } catch (error) {
      console.error('Simulation error:', error);
    } finally {
      setIsSimulating(false);
    }
  };
  // Utility function to pause execution
  const sleep = (ms) => {
    return new Promise((resolve) => setTimeout(resolve, ms));
  };

  // Handle textarea changes
  const handleTextareaChange = (e) => {
    setJsonDataString(e.target.value);
  };

  // Handle textarea blur to update the graph
  const handleTextareaBlur = () => {
    updateGraph();
  };

  const resetSimulation = () => {
    setJsonData(initialData);
    setSuggestNextActions(false);
  };

  return (
    <div className="font-sans m-0 p-5 flex flex-col h-screen  w-screen">
      <div className="flex justify-between mb-4">
        <div className="flex justify-end align-middle gap-4">
          <h1 className="text-center text-2xl font-bold ">Convoy Blaster</h1>
          <div >
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-green-800 border border-green-200 shadow-sm">
            <span className="w-2 h-2 mr-2 rounded-full bg-gray-400 animate-pulse"></span>
            IDLE
          </span>
        </div>
        </div>
        <div className="mb-4 text-center">
          <button onClick={resetSimulation} className="px-4 mr-4 py-2 text-lg font-semibold rounded bg-gray-800 hover:bg-gray-700 text-white">
            Reset
          </button>
          <button
            onClick={runSimulation}
            disabled={isSimulating}
            className={`px-4 py-2 text-lg font-semibold rounded ${
              isSimulating
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-800 hover:bg-teal-600 text-white"
            }`}
          >
            {isSimulating ? "Simulating..." : "Run Simulation"}
          </button>
        </div>
      </div>
      <div className="flex flex-1 h-4/5 border border-gray-800 rounded-lg overflow-hidden ">
        {/* Graph Container */}
        <div className="flex-3 bg-gray-900 relative overflow-hidden w-3/4">
          <svg ref={svgRef} className="w-full h-full"></svg>
        </div>

        <div className="flex-1 overflow-auto p-4">
          <MissionCard suggestNextActions={suggestNextActions} />
        {/* Mission */}
        <details>
          <summary>Mission Parameters</summary>
          <div>
          <div className="p-4">
            <label className="block text-sm font-medium text-white mb-2">
              Strategy
            </label>
            <select className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="offensive">Offensive</option>
              <option value="defensive">Defensive</option>
            </select>
          </div>
          <div className="p-4">
            <label className="block text-sm font-medium text-white mb-2">
              Enemy Strategy
            </label>
            <select className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="unknown">Unknown</option>

              <option value="offensive">Offensive</option>
              <option value="defensive">Defensive</option>
            </select>
          </div>

          </div>
        </details>
   
        <details>
          <summary>Vehicle repository</summary>
          <div className="flex flex-wrap gap-4 overflow-scroll">
            {
              vehicles.map((vehicle) => (
                <VehicleCard data={vehicle} />
              ))
            }
          </div>
        </details>

        {/* JSON Input */}
        <details>
          <summary>JSON Data</summary>
          <div className="flex-1 p-4 border-l border-gray-300 flex flex-col overflow-auto">
            <h3 className="text-lg font-semibold mb-2">Edit JSON</h3>
            <textarea
              value={jsonDataString}
              onChange={handleTextareaChange}
              onBlur={handleTextareaBlur}
              rows="20"
              className="flex-1 w-full resize-none font-mono p-2 border border-gray-300 rounded"
            ></textarea>
          </div>
          </details>
        </div>
      </div>
      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className="tooltip absolute bg-black bg-opacity-70 text-white text-sm p-2 rounded pointer-events-none opacity-0 transition-opacity duration-300 z-10"
      ></div>
    </div>
  );
};

export default App;
