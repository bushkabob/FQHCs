import DraggableSearchBar from '@/components/DraggableSearchBar';
import { View } from "react-native";
import MapView from 'react-native-maps';

export default function Map() {
    return (
        <View
            style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
            }}
        >
            <MapView style={{ width: '100%', height: '100%' }} />
            <DraggableSearchBar />
        </View>
    );
}

