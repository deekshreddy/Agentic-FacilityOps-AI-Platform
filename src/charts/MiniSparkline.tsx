import { LineChart, Line, ResponsiveContainer } from 'recharts';

type Props = {
  data: Array<{ timestamp: string; value: number }>;
  color: string;
};

export const MiniSparkline = ({ data, color }: Props) => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
};
