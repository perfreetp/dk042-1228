import React, { useState } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';
import { mockRules } from '@/data/mockGrowth';

const RulesPage: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number>(0);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? -1 : idx);
  };

  return (
    <ScrollView scrollY className={styles.page}>
      <View className={styles.header}>
        <Text className={styles.title}>📜 社区规则</Text>
        <Text className={styles.desc}>
          为了营造温暖安全的互助环境，请仔细阅读并遵守以下规则。你的每一次善意，都在让这个世界变得更好一点。
        </Text>
      </View>

      <View className={styles.list}>
        {mockRules.map((rule, idx) => (
          <View key={idx} className={styles.ruleCard}>
            <View
              className={styles.cardHeader}
              onClick={() => toggle(idx)}
            >
              <Text className={styles.title}>{rule.title}</Text>
              <Text
                className={classnames(styles.arrow, openIndex === idx && styles.open)}
              >
                ▼
              </Text>
            </View>
            <View
              className={classnames(
                styles.cardContent,
                openIndex === idx && styles.open
              )}
            >
              <Text className={styles.text}>{rule.content}</Text>
            </View>
          </View>
        ))}
      </View>

      <View className={styles.footer}>
        <Text className={styles.text}>
          💚 感谢每一位遵守规则的你
          {'\n'}
          让我们一起守护这个温暖的小角落
        </Text>
      </View>
    </ScrollView>
  );
};

export default RulesPage;
