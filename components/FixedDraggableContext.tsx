// FixedDraggableContext.tsx
import { createContext, useContext } from "react";
import type { ScrollHandlerProcessed, SharedValue } from "react-native-reanimated";

type FixedDraggableContextType = {
    progress: SharedValue<number>;
    snapping: SharedValue<boolean>;
    scrollY: SharedValue<number>;
    scrollHandler?: ScrollHandlerProcessed<Record<string, unknown>>
};

const FixedDraggableContext = createContext<FixedDraggableContextType | null>(null);

export const useFixedDraggable = () => {
    const ctx = useContext(FixedDraggableContext);
    if (!ctx)
        throw new Error(
            "useFixedDraggable must be used within a FixedDraggableProvider"
        );
    return ctx;
};

export const FixedDraggableProvider = FixedDraggableContext.Provider;
