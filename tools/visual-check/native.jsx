import React from 'react';
import {View} from 'react-native';
export const useFonts=()=>[true,null];
export const useSafeAreaInsets=()=>({top:0,bottom:0,left:0,right:0});
export const SafeAreaView=View;
export const SafeAreaProvider=({children})=>children;
export const Paths={cache:'/tmp/'};
export class Directory { constructor(){this.exists=false;} }
export class File { constructor(){this.exists=false;} }
export const randomUUID=()=>crypto.randomUUID();
export const printToFileAsync=async()=>{throw new Error('Native PDF only');};
export const isAvailableAsync=async()=>false;
export const shareAsync=async()=>{};
