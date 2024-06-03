import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import "./styles.css";

interface Category {
  id: string;
  name: string;
  market_cap: number;
  market_cap_change_24h: number;
  top_3_coins: string[];
}

const Treemap: React.FC = () => {

  const [data, setData] = useState([]);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const API_KEY = "CG-3yuJoCNmvvccenEcKq296hRt";

    async function fetchCategories() {
      const response = await fetch(
        `https://api.coingecko.com/api/v3/coins/categories`,
        {
          headers: {
            Authorization: `Bearer ${API_KEY}`,
          },
        }
      );
      const categories = await response.json();
      setData(categories);
    }

    fetchCategories();
  }, []);

  useEffect(() => {
    if (data.length === 0 || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    const width = 800;
    const height = 600;

    svg.attr("width", width).attr("height", height);

    const root = d3
      .hierarchy<{ children: Category[] }>({ children: data })
      //@ts-ignore
      .sum((d: { children: Category[] }) => d.market_cap)
      .sort((a, b) => (b.value || 0) - (a.value || 0));

    const treemapLayout = d3
      .treemap<{ children: Category[] }>()
      .size([width, height])
      .padding(1);

    treemapLayout(root);

    const nodes = svg
      .selectAll("g")
      .data(root.leaves())
      .enter()
      .append("g")
      //@ts-ignore
      .attr("transform", (d) => `translate(${d.x0},${d.y0})`);

    nodes
      .append("rect")
      //@ts-ignore
      .attr("width", (d) => d.x1 - d.x0)
      //@ts-ignore
      .attr("height", (d) => d.y1 - d.y0)
      //@ts-ignore
      .attr("fill", (d) => (d.data.market_cap_change_24h > 0 ? "green" : "red"))
      .on("mouseover", (event, d) => {
        if (tooltipRef.current) {
          tooltipRef.current.style.left = `${event.pageX + 10}px`;
          tooltipRef.current.style.top = `${event.pageY + 10}px`;
          tooltipRef.current.style.display = "flex";
          //@ts-ignore
          tooltipRef.current.innerHTML = d.data.top_3_coins
            .map((coin: any) => `<img src="${coin}" />`)
            .join("");
        }
      })
      .on("mouseout", () => {
        if (tooltipRef.current) {
          tooltipRef.current.style.display = "none";
          tooltipRef.current.innerHTML = "";
        }
      });

    nodes
      .append("text")
      .attr("dx", 4)
      .attr("dy", 14)
      //@ts-ignore
      .text((d) => d?.data?.name || null);
  }, [data]);

  return (
    <>
      <svg ref={svgRef}></svg>
      <div id="tooltip" ref={tooltipRef}></div>
    </>
  );
};

export default Treemap;
