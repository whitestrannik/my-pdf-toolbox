import { Card } from "../components";

interface PlaceholderViewProps {
  title: string;
  icon: string;
  description: string;
}

export const PlaceholderView: React.FC<PlaceholderViewProps> = ({
  title,
  icon,
  description,
}) => {
  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {icon} {title}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">{description}</p>
      </div>

      <Card>
        <div className="text-center py-16">
          <div className="text-6xl mb-4">{icon}</div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Coming Soon!
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            This tool is currently under development and will be available soon.
          </p>
        </div>
      </Card>
    </div>
  );
};
