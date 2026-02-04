
import React from 'react';
import { Box, Text } from 'ink';
import BigText from 'ink-big-text';
import Gradient from 'ink-gradient';
import { CocovConfig, DetailedCoverage } from '../types.js';

interface DashboardProps {
  config: CocovConfig; // Should match imports
  coverage: Record<string, DetailedCoverage>;
  stats: {
    total: number;
    covered: number;
    pct: number;
  };
}

export const Dashboard: React.FC<DashboardProps> = ({ config, coverage, stats }) => {
  // Config uses thresholds?.lines based on types.ts
  const threshold = config.thresholds?.lines || 80;
  const color = stats.pct >= threshold ? 'green' : 'red';

  return (
    <Box flexDirection="column" padding={1}>
      <Gradient name="morning">
        <BigText text="Cocov" />
      </Gradient>
      
      <Box borderStyle="round" borderColor={color} padding={1} flexDirection="column">
        <Text>
          Coverage: <Text color={color} bold>{stats.pct.toFixed(2)}%</Text>
        </Text>
        <Text>
          Threshold: {threshold}%
        </Text>
      </Box>

      <Box marginTop={1}>
        <Text bold>File Breakdown:</Text>
      </Box>
      
      {/* We could use ink-table here, but for simplicity let's map text first */}
      <Box flexDirection="column">
          {Object.entries(coverage).slice(0, 10).map(([file, cov]) => {
              // Simple heuristic for file pct
              const total = Object.keys(cov.s).length;
              const covered = Object.values(cov.s).filter((c: number) => c > 0).length;
              const pct = total ? (covered / total) * 100 : 100;
              const fileColor = pct >= 80 ? 'green' : pct >= 50 ? 'yellow' : 'red';
              
              const relativeFile = file.split('/').pop() || file;

              return (
                  <Box key={file} justifyContent="space-between">
                      <Text>{relativeFile}</Text>
                      <Text color={fileColor}>{pct.toFixed(0)}%</Text>
                  </Box>
              );
          })}
          {Object.keys(coverage).length > 10 && <Text dimColor>... and {Object.keys(coverage).length - 10} more</Text>}
      </Box>
    </Box>
  );
};
