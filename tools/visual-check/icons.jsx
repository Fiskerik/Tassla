import React from 'react';
import {Text} from 'react-native';
import glyphs from '../../node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/glyphmaps/Ionicons.json';
export function Ionicons({name, size=24, color, ...rest}) { return <Text {...rest} style={{fontFamily:'Ionicons',fontSize:size,color,lineHeight:size+2}}>{String.fromCodePoint(glyphs[name] || glyphs['help-outline'])}</Text>; }
Ionicons.font={};
export default Ionicons;
