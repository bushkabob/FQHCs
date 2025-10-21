import { FQHCSite } from "@/app/types";
import { Text, View } from "react-native";

interface CenterInfoSearchProps {
    site: FQHCSite
}

const CenterInfoSearch: React.FC<CenterInfoSearchProps> = ({site}) => {
    return (
        <View style={{backgroundColor: "gray", margin : 10, padding: 10, borderRadius: 40}} >
            <Text>{site["Site Name"]}</Text>
        </View>
    );
}

export default CenterInfoSearch;