import Image from 'next/image';

const GRADIENT_COLORS = ['#FF4D6A', '#7B61FF', '#3E9EFF', '#3ECFA8', '#FFB84D'];

function getColor(username: string) {
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  return GRADIENT_COLORS[Math.abs(hash) % GRADIENT_COLORS.length];
}

export function Avatar({
  uri,
  username,
  size = 40,
}: {
  uri?: string | null;
  username: string;
  size?: number;
}) {
  const color = getColor(username);
  const initials = username.slice(0, 2).toUpperCase();

  if (uri) {
    return (
      <div
        className="rounded-full overflow-hidden flex-shrink-0"
        style={{ width: size, height: size }}
      >
        <Image
          src={uri}
          alt={username}
          width={size}
          height={size}
          className="object-cover w-full h-full"
          unoptimized
        />
      </div>
    );
  }

  return (
    <div
      className="rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold"
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, ${color}, ${color}99)`,
        fontSize: size * 0.38,
      }}
    >
      {initials}
    </div>
  );
}
