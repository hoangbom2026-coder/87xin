import * as React from 'react';
import { cn } from '../../lib/cn';

export interface StableImgProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackSrc?: string;
}

export const StableImg: React.FC<StableImgProps> = ({
  src,
  alt = '',
  className,
  fallbackSrc = '/images/fallback.png',
  ...props
}) => {
  const [imgSrc, setImgSrc] = React.useState(src);
  return (
    <img
      src={imgSrc || fallbackSrc}
      alt={alt}
      className={cn('object-contain', className)}
      onError={() => setImgSrc(fallbackSrc)}
      {...props}
    />
  );
};

export default StableImg;
