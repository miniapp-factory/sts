"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Share } from "@/components/share";
import { url } from "@/lib/metadata";

const GRID_SIZE = 4;
const TARGET = 2048;

export default function Game() {
  const [grid, setGrid] = useState<number[][]>(Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(0)));
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);

  const addRandomTile = useCallback((g: number[][]) => {
    const empty: [number, number][] = [];
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (g[r][c] === 0) empty.push([r, c]);
      }
    }
    if (empty.length === 0) return g;
    const [r, c] = empty[Math.floor(Math.random() * empty.length)];
    const value = Math.random() < 0.9 ? 2 : 4;
    const newGrid = g.map(row => row.slice());
    newGrid[r][c] = value;
    return newGrid;
  }, []);

  const move = useCallback((dir: "up" | "down" | "left" | "right") => {
    const rotate = (g: number[][], times: number) => {
      let res = g;
      for (let t = 0; t < times; t++) {
        const newGrid: number[][] = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(0));
        for (let r = 0; r < GRID_SIZE; r++) {
          for (let c = 0; c < GRID_SIZE; c++) {
            newGrid[c][GRID_SIZE - 1 - r] = res[r][c];
          }
        }
        res = newGrid;
      }
      return res;
    };

    const compress = (g: number[][]) => {
      const newGrid: number[][] = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(0));
      for (let r = 0; r < GRID_SIZE; r++) {
        let pos = 0;
        for (let c = 0; c < GRID_SIZE; c++) {
          if (g[r][c] !== 0) {
            newGrid[r][pos] = g[r][c];
            pos++;
          }
        }
      }
      return newGrid;
    };

    const merge = (g: number[][]) => {
      let newScore = 0;
      for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE - 1; c++) {
          if (g[r][c] !== 0 && g[r][c] === g[r][c + 1]) {
            g[r][c] *= 2;
            g[r][c + 1] = 0;
            newScore += g[r][c];
          }
        }
      }
      return { grid: g, score: newScore };
    };

    let rotated = g;
    let times = 0;
    if (dir === "up") times = 1;
    else if (dir === "right") times = 2;
    else if (dir === "down") times = 3;
    rotated = rotate(g, times);

    const compressed = compress(rotated);
    const merged = merge(compressed);
    const finalCompressed = compress(merged.grid);

    const unrotated = rotate(finalCompressed, (4 - times) % 4);
    return { grid: unrotated, score: merged.score };
  }, []);

  const handleMove = useCallback((dir: "up" | "down" | "left" | "right") => {
    if (gameOver) return;
    const { grid: newGrid, score: delta } = move(grid);
    if (JSON.stringify(newGrid) === JSON.stringify(grid)) return; // no change
    const updatedGrid = addRandomTile(newGrid);
    setGrid(updatedGrid);
    setScore(prev => prev + delta);
    if (updatedGrid.some(row => row.includes(TARGET))) setWon(true);
    const hasEmpty = updatedGrid.some(row => row.includes(0));
    const canMove = !hasEmpty && updatedGrid.some((row, r) =>
      row.some((val, c) => {
        if (c < GRID_SIZE - 1 && val === updatedGrid[r][c + 1]) return true;
        if (r < GRID_SIZE - 1 && val === updatedGrid[r + 1][c]) return true;
        return false;
      })
    );
    if (!canMove) setGameOver(true);
  }, [grid, gameOver, move, addRandomTile]);

  useEffect(() => {
    setGrid(addRandomTile(addRandomTile(Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(0)))));
  }, [addRandomTile]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp") handleMove("up");
      else if (e.key === "ArrowDown") handleMove("down");
      else if (e.key === "ArrowLeft") handleMove("left");
      else if (e.key === "ArrowRight") handleMove("right");
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleMove]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="text-2xl font-bold">2048 Mini App</div>
      <div className="text-xl">Score: {score}</div>
      <div className="grid grid-cols-4 gap-2">
        {grid.flat().map((val, idx) => (
          <div
            key={idx}
            className="w-16 h-16 flex items-center justify-center bg-gray-200 rounded text-2xl font-semibold"
          >
            {val !== 0 ? val : null}
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Button onClick={() => handleMove("up")}>↑</Button>
        <Button onClick={() => handleMove("down")}>↓</Button>
        <Button onClick={() => handleMove("left")}>←</Button>
        <Button onClick={() => handleMove("right")}>→</Button>
      </div>
      {gameOver && (
        <div className="mt-4">
          <div className="text-lg font-semibold">
            {won ? "You won!" : "Game over!"}
          </div>
          <Share text={`I scored ${score} in 2048! ${url}`} />
        </div>
      )}
    </div>
  );
}
