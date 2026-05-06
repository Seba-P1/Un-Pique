import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Audio } from 'expo-av';
import { Play, Pause, Mic } from 'lucide-react-native';

interface AudioPlayerProps {
    uri: string;
    isOwn: boolean;
    tc: any;
}

export default function AudioPlayer({ uri, isOwn, tc }: AudioPlayerProps) {
    const sound = useRef<Audio.Sound | null>(null);
    const [playing, setPlaying] = useState(false);
    const [duration, setDuration] = useState(0);
    const [position, setPosition] = useState(0);
    const progress = useRef(new Animated.Value(0)).current;

    const togglePlay = async () => {
        if (!sound.current) {
            await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
            const { sound: s } = await Audio.Sound.createAsync({ uri });
            sound.current = s;
            s.setOnPlaybackStatusUpdate(status => {
                if (!status.isLoaded) return;
                setDuration(status.durationMillis || 0);
                setPosition(status.positionMillis || 0);
                const pct = status.durationMillis ? status.positionMillis / status.durationMillis : 0;
                progress.setValue(pct);
                if (status.didJustFinish) {
                    setPlaying(false);
                    progress.setValue(0);
                    setPosition(0);
                }
            });
        }
        if (playing) {
            await sound.current.pauseAsync();
            setPlaying(false);
        } else {
            await sound.current.playAsync();
            setPlaying(true);
        }
    };

    useEffect(() => {
        return () => {
            if (sound.current) {
                sound.current.unloadAsync();
            }
        };
    }, []);

    const formatTime = (ms: number) => {
        const s = Math.floor(ms / 1000);
        return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
    };

    const fillWidth = progress.interpolate({
        inputRange: [0, 1],
        outputRange: ['0%', '100%']
    });

    return (
        <View style={[
            styles.container,
            {
                backgroundColor: isOwn ? 'rgba(255, 107, 53, 0.15)' : tc.bgInput,
                borderColor: isOwn ? '#FF6B35' : tc.borderLight,
            }
        ]}>
            <Mic 
                size={14} 
                color={isOwn ? 'rgba(255,255,255,0.7)' : '#22C55E'} 
                style={{ marginRight: 6 }} 
            />

            <TouchableOpacity 
                style={[
                    styles.playBtn, 
                    { 
                        backgroundColor: isOwn ? 'rgba(255,255,255,0.25)' : 'rgba(34, 197, 94, 0.15)',
                        borderColor: isOwn ? 'rgba(255,255,255,0.4)' : '#22C55E',
                        borderWidth: 1.5,
                    }
                ]}
                onPress={togglePlay}
            >
                {playing ? (
                    <Pause size={14} color={isOwn ? '#fff' : '#22C55E'} fill={isOwn ? '#fff' : '#22C55E'} />
                ) : (
                    <Play size={14} color={isOwn ? '#fff' : '#22C55E'} fill={isOwn ? '#fff' : '#22C55E'} style={{ marginLeft: 2 }} />
                )}
            </TouchableOpacity>

            <View style={[styles.progressBarBg, { backgroundColor: tc.borderLight }]}>
                <Animated.View 
                    style={[
                        styles.progressBarFill, 
                        { 
                            width: fillWidth,
                            backgroundColor: isOwn ? 'rgba(255,255,255,0.8)' : '#22C55E' 
                        }
                    ]} 
                />
            </View>

            <Text style={[
                styles.timeText,
                { color: isOwn ? '#FF6B35' : tc.textMuted }
            ]}>
                {formatTime(playing ? position : duration)}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: 200,
        height: 52,
        borderRadius: 26,
        borderWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        gap: 6
    },
    playBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    progressBarBg: {
        flex: 1,
        height: 4,
        borderRadius: 2,
        overflow: 'hidden'
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 2
    },
    timeText: {
        fontSize: 11,
        minWidth: 28,
        textAlign: 'right'
    }
});
