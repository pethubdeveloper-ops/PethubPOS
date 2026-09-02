import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useApp } from '@/context/AppContext';
import { WAREHOUSE, PRESIDENT } from '@/data/seeds';

type BottomTabBarProps = { state: any; navigation: any; descriptors: any };

type TabDef = { name: string; label: string; icon: string };

// Tabs for Warehouse / President
const ADMIN_TABS: TabDef[] = [
  { name: 'index',      label: 'Home',    icon: 'home'            },
  { name: 'products',   label: 'Stock',   icon: 'package'         },
  { name: 'deliveries', label: 'Deliver', icon: 'truck'           },
  { name: 'requests',   label: 'Reqs',    icon: 'git-pull-request' },
  { name: 'more',       label: 'More',    icon: 'menu'            },
];

// Tabs for branch accounts — Requests visible; My Inv accessible via More → Branch Inventory
const BRANCH_TABS: TabDef[] = [
  { name: 'index',      label: 'Home',    icon: 'home'             },
  { name: 'products',   label: 'Stock',   icon: 'package'          },
  { name: 'deliveries', label: 'Deliver', icon: 'truck'            },
  { name: 'requests',   label: 'Requests', icon: 'git-pull-request' },
  { name: 'more',       label: 'More',    icon: 'menu'             },
];

export default function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { userBranch } = useApp();

  const isBranch = userBranch !== WAREHOUSE && userBranch !== PRESIDENT && !!userBranch;
  const VISIBLE_TABS = isBranch ? BRANCH_TABS : ADMIN_TABS;

  return (
    <View
      style={[
        styles.bar,
        {
          backgroundColor:  colors.card,
          borderTopColor:   colors.border,
          paddingBottom:    insets.bottom || 8,
        },
      ]}
    >
      {VISIBLE_TABS.map(tab => {
        const routeIndex = state.routes.findIndex((r: any) => r.name === tab.name);
        const isFocused  = state.index === routeIndex;
        const color      = isFocused ? colors.primary : colors.mutedForeground;

        const onPress = () => {
          if (routeIndex === -1) return;
          const event = navigation.emit({
            type:       'tabPress',
            target:     state.routes[routeIndex].key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(state.routes[routeIndex].name);
          }
        };

        return (
          <TouchableOpacity
            key={tab.name}
            style={styles.tab}
            onPress={onPress}
            activeOpacity={0.7}
          >
            <Feather name={tab.icon as any} size={22} color={color} />
            <Text style={[styles.label, { color }]}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection:  'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop:     8,
  },
  tab: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
    gap:            3,
    paddingVertical: 2,
  },
  label: {
    fontSize:   10,
    fontWeight: '600',
  },
});
