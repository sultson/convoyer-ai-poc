import { useState, useEffect, useRef } from "react";
import * as d3 from "d3";
import { vehicles } from "./config/vehicles";
import VehicleCard from "./components/VehicleCard";
import MissionCard from "./components/MissionCard";
import RankingCard from "./components/RankingCard";
import VideoTimeline from "./components/VideoTimeline";
import { typePointsMap } from "./config/typePointsMap";

const App = () => {
  // Initial JSON Data
  const initialData = {
    nodes: [
      // {
      //   id: "Vehicle 1",
      //   type: "vehicle",
      //   metadata: {
      //     Capacity: "5000L",
      //     Location: "Site A",
      //     Status: "Active",
      //   },
      // },
      // {
      //   id: "Vehicle 2",
      //   type: "vehicle",
      //   metadata: {
      //     Capacity: "3000L",
      //     Location: "Site B",
      //     Status: "Maintenance",
      //   },
      // },
      // {
      //   id: "Vehicle 3",
      //   type: "vehicle",
      //   metadata: {
      //     Capacity: "2500L",
      //     Location: "Site C",
      //     Status: "Inactive",
      //   },
      // },
    ],
    links: [],
  };

  // State for JSON Data
  const [jsonData, setJsonData] = useState(initialData);
  const [isSimulating, setIsSimulating] = useState(false);
  const [suggestNextActions, setSuggestNextActions] = useState(false);
  const [ourStrategy, setOurStrategy] = useState("defense");
  // Refs for SVG and Tooltip
  const svgRef = useRef(null);
  const tooltipRef = useRef(null);
  const [status, setStatus] = useState("idle");
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
    svg.selectAll("*").remove(); // Clear previous contents

    const container = svgRef.current.parentElement;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Set SVG dimensions
    svg
      .attr("width", "100%")
      .attr("height", "100%")
      .style("overflow", "visible");

    // Initialize simulation
    const simulation = d3
    .forceSimulation(jsonData.nodes)
    .force(
      'link',
      d3.forceLink(jsonData.links).id((d) => d.id).distance(120)
    )
    .force('charge', d3.forceManyBody().strength(-200))
    .force(
      'x',
      d3.forceX((d, i) => (d.type === 'vehicle' ? i * 200 : null)).strength((d) =>
        d.type === 'vehicle' ? 1 : 0.1
      ) // Vehicles rigidly spaced, observations float
    )
    .force(
      'y',
      d3.forceY((d) => (d.type === 'vehicle' ? height / 2 : null)).strength((d) =>
        d.type === 'vehicle' ? 1 : 0.1
      ) // Vehicles stay centered, observations spread
    )
    .force(
      'collision',
      d3.forceCollide().radius((d) => (d.type === 'vehicle' ? 50 : 30))
    )
    .force(
      'radial',
      d3.forceRadial((d) => (d.type === 'observation' ? 150 : 0), width / 2, height / 2)
        .strength((d) => (d.type === 'observation' ? 0.3 : 0))
    );

    // Define arrow markers for links
    svg
      .append("defs")
      .selectAll("marker")
      .data(["end"])
      .enter()
      .append("marker")
      .attr("id", (d) => d)
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 25)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "#999");

    // Draw links
    const link = svg
      .append("g")
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.6)
      .selectAll("line")
      .data(jsonData.links)
      .enter()
      .append("line")
      .attr("stroke-width", 2)
      .attr("marker-end", "url(#end)");

    // Draw nodes
    const node = svg
      .append("g")
      .selectAll(".node")
      .data(jsonData.nodes)
      .enter()
      .append("g")
      .attr("class", "node")
      .call(drag(simulation));

    // Define shapes based on node type and apply styles
    node.each(function (d) {
      if (d.type === "vehicle") {
        d3.select(this)
          .append("circle")
          .attr("r", 40)
          .attr("fill", d.metadata?.isOcluded ? "#ccc" : "#059669")
          .attr("stroke", "#333")
          .attr("stroke-width", 2);
      } else if (d.type === "observation") {
        d3.select(this)
          .append("rect")
          .attr("x", -50)
          .attr("y", -15)
          .attr("width", 100)
          .attr("height", 30)
          .attr("fill", "#ea580c")
          .attr("stroke", (d) => (d.metadata?.enriched ? "#3b82f6" : "#333"))
          .attr("stroke-width", (d) => (d.metadata?.enriched ? 4 : 2));
      }
    });

    // Add labels
    node
      .filter((d) => d.type === "vehicle")
      .append("text")
      .attr("dy", (d) => (d.type === "vehicle" ? 6 : 4))
      .attr("text-anchor", "middle")
      .text((d) => d?.label || d.id)
      .style("pointer-events", "none")
      .style("font-size", "12px")
      .style("font-family", "monospace")
      .style("font-weight", "bold")
      .style("fill", (d) => (d.type === "vehicle" ? "#fff" : "#fff"));

    node
      .filter((d) => d.type === "observation")
      .append("text")
      .attr("dy", (d) => (d.type === "observation" ? 6 : 4))
      .attr("text-anchor", "middle")
      .text((d) => `${d?.label} (${(d?.metadata?.confidence * 100).toFixed(0)}%)`)
      .style("pointer-events", "none")
      .style("font-size", "12px")
      .style("font-family", "monospace")
      .style("font-weight", "bold")
      .style("fill", (d) => (d.type === "observation" ? "#fff" : "#fff"));
  

    // Add rank labels to vehicles
    node
      .filter((d) => d.type === "vehicle" && d.metadata.rank)
      .append("text")
      .attr("dy", 20)
      .attr("text-anchor", "middle")
      .text((d) => `Rank: ${d.metadata.rank}`)
      .style("pointer-events", "none")
      .style("font-size", "10px")
      .style("fill", "#fff");


      // if vehicle rank is 1 add a red border to the vehicle
      node
      .filter((d) => d.type === "vehicle" && d.metadata.rank === 1)
      .select("circle")
      .attr("stroke", "#f00")
      .attr("stroke-width", 4);

    // Add confidence percentages to observations
    // node
    //   .filter((d) => d.type === "observation" && d?.metadata?.confidence)
    //   .append("text")
    //   .attr("dy", 20)
    //   .attr("text-anchor", "middle")
    //   .text((d) => `Confidence: ${d?.metadata?.confidence}`)
    //   .style("pointer-events", "none")
    //   .style("font-size", "10px")
    //   .style("fill", "#fff");

    // Tooltip setup
    const tooltip = d3.select(tooltipRef.current);

    node
      .on("mouseover", (event, d) => {
        let content = `<strong>ID:</strong> ${d.id}<br/>`;
        if (d.metadata) {
          for (const [key, value] of Object.entries(d.metadata)) {
            content += `<strong>${key}:</strong> ${value}<br/>`;
          }
        }
        if (d?.metadata?.armorId) {
          content += `<strong>Armor ID:</strong> ${vehicles.find(v => v.armorId === d.metadata.armorId)?.name}<br/>`;
        }
        tooltip
          .html(content)
          .style("left", event.pageX + 15 + "px")
          .style("top", event.pageY + 15 + "px")
          .transition()
          .duration(200)
          .style("opacity", 0.9);
      })
      .on("mousemove", (event) => {
        tooltip
          .style("left", event.pageX + 15 + "px")
          .style("top", event.pageY + 15 + "px");
      })
      .on("mouseout", () => {
        tooltip.transition().duration(200).style("opacity", 0);
      });

    // Simulation tick
    simulation.on("tick", () => {
      link
        .attr("x1", (d) => d.source.x)
        .attr("y1", (d) => d.source.y)
        .attr("x2", (d) => d.target.x)
        .attr("y2", (d) => d.target.y);

      node.attr("transform", (d) => `translate(${d.x},${d.y})`);

      // Boundary Constraints
      jsonData.nodes.forEach((d) => {
        const padding = 50; // Increased padding for better visibility
        d.x = Math.max(padding, Math.min(width - padding, d.x));
        d.y = Math.max(padding, Math.min(height - padding, d.y));
      });
    });

    // Restart the simulation
    simulation.alpha(1).restart();
  };
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
    setStatus("simulating");
    if (isSimulating) return; // Prevent multiple simulations
    setIsSimulating(true);

    try {
      // Step 1: Display initial nodes (3 Vehicles)
      const step1Data = {
        nodes: [
          {
            id: "truck1",
            label: "Vehicle 1",
            type: "vehicle",
            metadata: {
              isOcluded: false,
            },
          },
          {
            id: "truck1Observation1",
            label: "Truck",
            type: "observation",
            metadata: {
              ObservationID: "Obs-1",
              confidence: 0.63,
            },
          },
        ],
        links: [
          {
            source: "truck1",
            target: "truck1Observation1",
          },
        ],
      };
      setJsonData(step1Data);
      await sleep(2500); // Wait 2 seconds

      let step2Data = {
        nodes: [
          ...step1Data.nodes,
          {
            id: "truck2",
            label: "Vehicle 2",
            type: "vehicle",
            metadata: {
              isOcluded: false,
            },
          },
          {
            id: "truck2Observation1",
            label: "Truck",
            type: "observation",
            metadata: {
              ObservationID: "Obs-3",
              confidence: 0.78,
            },
          },
        ],
        links: [
          ...step1Data.links,
          {
            source: "truck2",
            target: "truck2Observation1",
          },
          {
            source: "truck1",
            target: "truck2",
          },
        ],
      };

      // in step2Data - find the truck1Observation1 node and set its metadata confidence to 0.5
      step2Data.nodes.find(
        (node) => node.id === "truck1Observation1"
      ).metadata.confidence = 0.52;

      setJsonData(step2Data);
      await sleep(1750); // Wait 2 seconds

      // Step 3: Add 5 more Observation Nodes (total 8)
      let step3Nodes = [...step2Data.nodes];

      // modify truck1 metadata isOcluded to true
      step3Nodes.find((node) => node.id === "truck1").metadata.isOcluded = true;

      const step3Data = {
        nodes: step3Nodes,
        links: [...step2Data.links],
      };
      setJsonData({ ...step3Data });
      await sleep(2500); // Wait 2 seconds


       // Step 3: Add 5 more Observation Nodes (total 8)
       let step35Nodes = [...step3Data.nodes];

       // modify truck1 metadata isOcluded to true
       step35Nodes.find((node) => node.id === "truck1").metadata.isOcluded = false;
 
       const step35Data = {
         nodes: step35Nodes,
         links: [...step3Data.links],
       };
       setJsonData({ ...step35Data });
 
      await sleep(4000); // Wait 2 seconds

      

      let step4Data = {
        nodes: [
          ...step35Data.nodes,
          {
            id: "truck3",
            label: "Vehicle 3",
            type: "vehicle",
            metadata: {},
          },
          {
            id: "truck3Observation1",
            label: "Truck",
            type: "observation",
            metadata: {
              ObservationID: "Obs-4",
              confidence: 0.71,
            },
          },
        ],
        links: [
          ...step35Data.links,
          {
            source: "truck2",
            target: "truck3",
          },
          {
            source: "truck3",
            target: "truck3Observation1",
          },
        ],
      };

      setJsonData(step4Data);

      await sleep(2000); // Wait 2 seconds


      // Step 3: Add 5 more Observation Nodes (total 8)
      let step45Nodes = [...step4Data.nodes];

      // modify truck1 metadata isOcluded to true
      step45Nodes.find((node) => node.id === "truck2").metadata.isOcluded = true;

      const step45Data = {
        nodes: step45Nodes,
        links: [...step4Data.links],
      };
      setJsonData({ ...step45Data });

      await sleep(2500); // Wait 2 seconds

      let step5Data = {
        nodes: [
          {
            id: "truck0",
            label: "Vehicle 0",
            type: "vehicle",
            metadata: {},
          },
          ...step4Data.nodes,
         
          {
            id: "truck0Observation1",
            label: "Truck",
            type: "observation",
            metadata: {
              ObservationID: "Obs-5",
              confidence: 0.92,
            },
          },
        ],
        links: [
          ...step4Data.links,
          {
            source: "truck0",
            target: "truck1",
          },
          {
            source: "truck0",
            target: "truck0Observation1",
          },
        ],
      };

      step5Data.nodes.find((node) => node.id === "truck2").metadata.isOcluded = false;

      const _step5Data = {
        nodes: [...step5Data.nodes],
        links: [...step5Data.links],
      };
      setJsonData({ ..._step5Data });


      
      await sleep(2500); // Wait 2 seconds

      let step6Data = {
        nodes: [
          ...step5Data.nodes,
          {
            id: "truck3Observation2",
            label: "BTR",
            type: "observation",
            metadata: {
              ObservationID: "Obs-6",
              confidence: 0.94,
              armorId: 395
            },
          },
        ],
        links: [
          ...step5Data.links,
          {
            source: "truck3",
            target: "truck3Observation2",
          },
        ],
      };

      const _step6Data = {
        nodes: [...step6Data.nodes],
        links: [...step6Data.links],
      };
      setJsonData({ ..._step6Data });
      await sleep(3500); // Wait 2 seconds


      // Step 3: Add 5 more Observation Nodes (total 8)
      let step65Nodes = [...step6Data.nodes];

      // modify truck1 metadata isOcluded to true
      step65Nodes.find((node) => node.id === "truck1").metadata.isOcluded = true;

      const step65Data = {
        nodes: step65Nodes,
        links: [...step6Data.links],
      };
      setJsonData({ ...step65Data });

      await sleep(2500); // Wait 2 seconds

      let step7Data = {
        nodes: [...step65Data.nodes],
        links: [
          ...step65Data.links,
          {
            source: "truck3",
            target: "truck3Observation2",
          },
        ],
      };

      function getScore(node,nodeObservations) {
        const baseScore = 500

        //mock
        // if (node.id === "truck3") return 1500
        // if (node.id === "truck2") return 750
        // if (node.id === "truck1") return 750
        // if (node.id === "truck0") return 750
        // return baseScore

        // now we look for all nodeObservations and see if any of them have an armorId
        const matchingObservations = nodeObservations.filter(obs => obs.metadata.armorId)
        if (matchingObservations.length === 0) return baseScore
        // if we have more than 1 matching observation, we pick one with highest confidence
        if (matchingObservations.length > 1) {
          matchingObservations.sort((a,b) => b.metadata.confidence - a.metadata.confidence)
        }
        const matchingObservation = matchingObservations[0]
        // next we get the corresponding vehicle and get its rank
        const vehicle = vehicles.find(v => v.armorId === matchingObservation.metadata.armorId)
        // next we get all the attributes of the vehicle and calculate the score based on the typePointsMap
        const attributes = vehicle.attributes
        const score = attributes.reduce((acc,attr) => {
          const points = typePointsMap[ourStrategy].find(t => t.type === attr.type)?.points
          return acc + points
        },0)

        return baseScore + score
      }
    
      // for each node in step7Data that has a type vehicle, we calculate the score using getScore
      step7Data.nodes.filter(n => n.type === 'vehicle').forEach(node => {
        const nodeObservations = step7Data.nodes.filter(n => n.type === 'observation' && n.id.includes(node.id))

        node.metadata.rankScore = getScore(node,nodeObservations)
      })

      // assign truck3 metadata rank of 1
      step7Data.nodes.find((node) => node.id === "truck3").metadata.rank = 1;
      // step7Data.nodes.find(
      //   (node) => node.id === "truck3Observation1"
      // ).metadata.rankScore = 1500;
      //assign truck2 metadata rank of 2
      step7Data.nodes.find((node) => node.id === "truck2").metadata.rank = 2;
      // step7Data.nodes.find(
      //   (node) => node.id === "truck2Observation1"
      // ).metadata.rankScore = 750;
      //assign truck1 metadata rank of 3
      step7Data.nodes.find((node) => node.id === "truck1").metadata.rank = 3;
      // step7Data.nodes.find(
      //   (node) => node.id === "truck1Observation1"
      // ).metadata.rankScore = 750;

      //assign truck0 metadata rank of 4
      step7Data.nodes.find((node) => node.id === "truck0").metadata.rank = 4;
      // step7Data.nodes.find(
      //   (node) => node.id === "truck0Observation1"
      // ).metadata.rankScore = 750;

      setJsonData(step7Data);

      // // // Step 5: Link enriched Observations back to Vehicles
      // // const enrichedObs = step4Data.nodes.filter(
      // //   (node) => node.type === 'observation' && node.metadata.enriched
      // // );

      // // const step5Links = enrichedObs.map((obs) => {
      // //   // Randomly assign to one Vehicle
      // //   const randomVehicle =
      // //     step1Data.nodes[
      // //       Math.floor(Math.random() * step1Data.nodes.length)
      // //     ];
      // //   return { source: randomVehicle.id, target: obs.id };
      // // });

      // // const step5Data = {
      // //   nodes: step4Data.nodes,
      // //   links: step5Links,
      // // };
      // // setJsonData(step5Data);
      // await sleep(2000); // Wait 2 seconds

      // // Step 6: Assign random ranks to Vehicles
      // const shuffledVehicles = [...step1Data.nodes].sort(() => 0.5 - Math.random());
      // const ranks = [1, 2, 3];
      // const step6Nodes = step5Data.nodes.map((node) => {
      //   if (node.type === 'vehicle') {
      //     const rank = ranks.shift(); // Assign rank 1 to 3
      //     return {
      //       ...node,
      //       metadata: { ...node.metadata, rank },
      //     };
      //   }
      //   return node;
      // });

      // const step6Data = {
      //   nodes: step6Nodes,
      //   links: step5Data.links,
      // };
      // setJsonData(step6Data);
      // await sleep(2000); // Wait 2 seconds
      setSuggestNextActions(true);
      // // Final Step: Optionally, you can add more steps or conclude the simulation
    } catch (error) {
      console.error("Simulation error:", error);
    } finally {
      setIsSimulating(false);
      setStatus("idle");
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
        {/* <div className="flex justify-end align-middle gap-4">
          <h2 className="text-center text-2xl font-bold ">Convoyer</h2>
          <div>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-green-800 border border-green-200 shadow-sm">
              <span className="w-2 h-2 mr-2 rounded-full bg-gray-400 animate-pulse"></span>
              {status.toUpperCase()}
            </span>
          </div>
        </div> */}
        <VideoTimeline frameCount={12} onStart={() => runSimulation()}  onReset={() => resetSimulation()} isSimulating={isSimulating} />
       
      </div>
      <div className="flex flex-1 h-4/5 border border-gray-800 rounded-lg overflow-hidden ">
        {/* Graph Container */}
        <div className="flex-3 bg-gray-900 relative overflow-hidden w-3/4">
          <svg ref={svgRef} className="w-full h-full"></svg>

          <div className="absolute top-0 right-0 w-1/4">
            <RankingCard data={jsonData?.nodes} />
          </div>
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
              {vehicles.map((vehicle) => (
                <VehicleCard data={vehicle} />
              ))}
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
