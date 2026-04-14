import { Composition } from "remotion";
import { BentoDemo } from "./BentoDemo";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="BentoDemo"
        component={BentoDemo}
        durationInFrames={450}
        fps={30}
        width={1280}
        height={720}
      />
    </>
  );
};
