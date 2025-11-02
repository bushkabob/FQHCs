import { FQHCSite } from "@/app/types";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, Text, View } from "react-native";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from "react-native-reanimated";

interface CenterInfoSearchProps {
    site: FQHCSite;
    color: string;
    textColor: string;
    unit: string;
    onClick: Function
}

function SiteCard({ site, color, textColor, unit, onClick }: CenterInfoSearchProps) {
    const router = useRouter();
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    return (
        <Pressable
            onPress={()=>onClick()}
            onPressIn={() => {
                scale.value = withSpring(1.05, { duration: 0.9, dampingRatio: 1 });
            }}
            onPressOut={() => {
                scale.value = withSpring(1, { duration: 0.9, dampingRatio: 1 });
            }}
        >
            <Animated.View
                style={[
                    animatedStyle,
                    {
                        backgroundColor: color,
                        margin: 10,
                        padding: 10,
                        borderRadius: 40,
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 10,
                    },
                ]}
            >
                <View
                    style={{
                        aspectRatio: 1,
                        width: 40,
                        backgroundColor: "red",
                        borderStyle: "solid",
                        borderColor: "darkred",
                        borderWidth: 2,
                        borderRadius: 100,
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <Ionicons name="medical" size={24} color={"white"} />
                </View>

                <View style={{ flexShrink: 1 }}>
                    <Text
                        style={{
                            color: textColor,
                            flexWrap: "wrap",
                            width: "100%",
                        }}
                    >
                        {site["Site Name"]}
                    </Text>
                </View>
                
                <View style={{ flexGrow: 1, alignItems: "center", flexDirection: "row", justifyContent: "flex-end" }}>
                    <Text style={{color: textColor}} >{ ((unit === "mi" ? 0.621371 : 1) * site["distance"]).toFixed(1) + " " + unit}</Text>
                    <Ionicons
                        name="chevron-forward"
                        size={24}
                        color={textColor}
                    />
                </View>
            </Animated.View>
        </Pressable>
    );
}

export default SiteCard;
