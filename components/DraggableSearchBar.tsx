// DraggableSearchBar.tsx
import { useThemeColor } from "@/hooks/use-theme-color";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { GlassContainer, GlassView } from "expo-glass-effect";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Dimensions, Keyboard, Pressable, View } from "react-native";
import { Gesture, GestureDetector, GestureHandlerRootView, TextInput } from "react-native-gesture-handler";
import Animated, { Easing, Extrapolate, interpolate, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { runOnJS } from "react-native-worklets";

type DraggableSearchBarProps = {
	searchContent?: React.ReactNode;
	children?: React.ReactNode;
}

const DraggableSearchBar: React.FC<DraggableSearchBarProps> = ({children, searchContent}) => {
	const themeBack = useThemeColor({}, 'background');
	const themeText = useThemeColor({}, 'text');

	const TextInputRef = React.useRef<TextInput>(null);

	const { height, width } = Dimensions.get("window");
	const maxHeight = height - Constants.statusBarHeight;

	const config = { duration: 500, easing: Easing.bezier(0.5, 0.01, 0, 1),};

	const minHeight = 65;
	const viewHeight = useSharedValue(minHeight);

	function dismissKeyboard () {
		Keyboard.dismiss();
	};

	const panGesture = Gesture.Pan()
		.onBegin(() => {
			runOnJS(dismissKeyboard)();
		})
		.onChange((event) => {
			let newHeight = viewHeight.value + -event.changeY;
			newHeight = Math.max(minHeight, Math.min(maxHeight, newHeight));
			viewHeight.value = newHeight;
		})
		.onFinalize(() => {
			const quarterHeight = maxHeight / 4;
			if (viewHeight.value > quarterHeight * 3) {
				viewHeight.value = withTiming(maxHeight, config);
				return;
			}
			else if (viewHeight.value > quarterHeight) {
				viewHeight.value = withTiming(maxHeight/2, config);
				return;
			} else {
				viewHeight.value = withTiming(minHeight, config);
			}
		});

	const animatedStyles = useAnimatedStyle(() => {
		return {
			height: viewHeight.value,
			bottom: 20 - 21 * (viewHeight.value - minHeight) / (maxHeight - minHeight),
			left: 20 - 21 * (viewHeight.value - minHeight) / (maxHeight - minHeight),
			right: 20 - 21 * (viewHeight.value - minHeight) / (maxHeight - minHeight)
		};
	});

	const animatedChildrenStyles = useAnimatedStyle(() => {
		return {
			opacity: interpolate(viewHeight.value, [maxHeight / 2, 3 * maxHeight / 4], [1, 0]),
			bottom: viewHeight.value + 30 - 21 * (viewHeight.value - minHeight) / (maxHeight - minHeight),
			left: 20 - 21 * (viewHeight.value - minHeight) / (maxHeight - minHeight),
			right: 20 - 21 * (viewHeight.value - minHeight) / (maxHeight - minHeight),
			pointerEvents: viewHeight.value <= maxHeight / 2 ? "box-none" : "none"
		};
	});

	const scrollY = useSharedValue(0);

	// Smoothly fade gradient in as content scrolls under glass
	const gradientAnimatedStyle = useAnimatedStyle(() => {
		const opacity = interpolate(
		scrollY.value,
		[0, 80], // fade range
		[0, 1],  // 0 = fully hidden, 1 = fully visible
		Extrapolate.CLAMP
		);
		return { opacity: withTiming(opacity, { duration: 180 }) };
	});

	// Scroll event handler
	const scrollHandler = useAnimatedScrollHandler({
		onScroll: (event) => {
		scrollY.value = event.contentOffset.y;
		},
	});

	return (
			<>
				<Animated.View style={[{position: "absolute", marginHorizontal: 10}, animatedChildrenStyles]} >
					{children}
				</Animated.View>
				<GestureHandlerRootView style={{flex: 1, width: "100%"}} >
					<GestureDetector gesture={panGesture}>
						<Animated.View style={[{ position: 'absolute', overflow: 'hidden', borderRadius: 40}, animatedStyles]}>
							<GlassContainer>
									<GlassView style={{zIndex: 30, width: "100%", alignItems: "center", paddingBottom: 10, height: "100%"}} >
										<View style={{backgroundColor: "#a5adb0", height: 4, marginHorizontal: 10, marginVertical: 4, borderRadius: 20, width: 50, zIndex: 100}} />
										<Pressable onPress={()=>TextInputRef.current?.focus()} style={{alignSelf: "stretch", zIndex: 100}} >
											<GlassView tintColor={themeBack} style={{ flexDirection: "row", alignSelf: "stretch", alignItems: "center", height: 40, marginHorizontal: 10, marginVertical: 2, borderRadius: 80}} >
												<Ionicons name="search" size={20} color={themeText} style={{ marginLeft: 10, marginRight: 5 }} />
												<TextInput onFocus={()=>viewHeight.value = withTiming(maxHeight, config)} ref={TextInputRef} placeholder="Search FQHCs" placeholderTextColor={themeText} style={{width: "100%", color: themeText}} />
											</GlassView>
										</Pressable>
										<View style={{top: 0, position: "absolute", height: "100%"}}>
											<Animated.View
												style={[
												{
													position: "absolute",
													top: 0,
													left: 0,
													right: 0,
													height: 100,
													zIndex: 50,
												},
												gradientAnimatedStyle,
												]}
											>
												<LinearGradient
													colors={['rgba(255,255,255,0.8)', 'rgba(255,255,255,0)']}
													start={{ x: 0.5, y: 0 }}
													end={{ x: 0.5, y: 1 }}
													style={{ flex: 1, height: 100 }}
													/>
											</Animated.View>
											<Animated.ScrollView showsVerticalScrollIndicator={false} onScroll={scrollHandler} >
												<View style={{height: 64}} />
												{searchContent}
												<View style={{height: 20}} />
											</Animated.ScrollView>
											
										</View>
								</GlassView>
							</GlassContainer>
						</Animated.View>
					</GestureDetector>
				</GestureHandlerRootView>
			</>
	)
}

export default DraggableSearchBar;