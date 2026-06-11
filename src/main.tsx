import React from 'react';
import ReactDOM from 'react-dom/client';
import { ConfigProvider, theme } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import App from './App';
import './styles/global.css';

/**
 * 涓婚锛氬鍙ょ數褰卞伐浣滃锛圕inematic Studio锛? * 涓昏壊锛氱爾绾㈣丹闄?#C8553D
 * 寮鸿皟锛氶潚缁?#588B8B銆佺惀鐝€ #D4A24C
 * 涓€ц儗鏅細娓╂殩绫宠壊 + 鐧借壊鍗＄墖
 */
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConfigProvider
      locale={zhCN}
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          // 涓昏壊锛氱爾绾㈣丹闄?          colorPrimary: '#C8553D',
          colorPrimaryHover: '#A84635',
          colorPrimaryActive: '#8E3A2C',
          colorPrimaryBg: '#FBEEEA',
          colorPrimaryBgHover: '#F5DDD6',
          colorPrimaryBorder: '#E5A99C',
          colorPrimaryText: '#A84635',
          colorPrimaryTextHover: '#C8553D',
          colorPrimaryTextActive: '#8E3A2C',

          // 淇℃伅/娆″己璋冿細闈掔豢
          colorInfo: '#588B8B',
          colorInfoHover: '#467576',
          colorInfoBg: '#E0E8E8',

          // 鎴愬姛
          colorSuccess: '#6B8E4E',
          colorSuccessBg: '#E8EFE0',

          // 璀﹀憡
          colorWarning: '#D4A24C',
          colorWarningBg: '#F5ECDA',

          // 閿欒
          colorError: '#B54A4A',
          colorErrorBg: '#F2DEDE',

          // 鏂囧瓧
          colorText: '#2D2A26',
          colorTextSecondary: '#5C5852',
          colorTextTertiary: '#8A8580',
          colorTextQuaternary: '#B5B0A8',
          colorTextDescription: '#5C5852',
          colorTextPlaceholder: '#8A8580',
          colorTextHeading: '#2D2A26',
          colorTextLabel: '#5C5852',
          colorTextDisabled: '#B5B0A8',

          // 鑳屾櫙
          colorBgContainer: '#FFFFFF',
          colorBgElevated: '#FAF7F1',
          colorBgLayout: '#F5F1EA',
          colorBgSpotlight: '#FFFFFF',
          colorBgMask: 'rgba(45, 42, 38, 0.45)',

          // 杈规
          colorBorder: '#E0D9CC',
          colorBorderSecondary: '#EDE7DA',
          colorSplit: '#D6CFC1',

          // 褰㈢姸
          borderRadius: 6,
          borderRadiusLG: 8,
          borderRadiusSM: 4,

          // 瀛椾綋
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'PingFang SC', 'Microsoft YaHei', sans-serif",
          fontSize: 14,

          // 鎺т欢
          controlHeight: 32,
          controlHeightSM: 24,
          controlHeightLG: 40,

          // 闃村奖
          boxShadow:
            '0 1px 2px 0 rgba(45, 42, 38, 0.06), 0 1px 6px -1px rgba(45, 42, 38, 0.08), 0 2px 4px 0 rgba(45, 42, 38, 0.04)',
          boxShadowSecondary:
            '0 6px 16px 0 rgba(45, 42, 38, 0.08), 0 3px 6px -4px rgba(45, 42, 38, 0.12), 0 9px 28px 8px rgba(45, 42, 38, 0.05)',
        },
        components: {
          Layout: {
            bodyBg: '#F5F1EA',
            headerBg: '#FFFFFF',
            headerHeight: 56,
            headerPadding: '0 24px',
            siderBg: '#EDE7DA',
            footerBg: '#FFFFFF',
            headerColor: '#2D2A26',
            triggerBg: '#EDE7DA',
          },
          Card: {
            colorBgContainer: '#FFFFFF',
            colorBorderSecondary: '#E0D9CC',
            headerBg: 'transparent',
            headerFontSize: 14,
            headerHeight: 44,
            headerHeightSM: 36,
            paddingLG: 16,
          },
          Button: {
            colorPrimary: '#C8553D',
            colorPrimaryHover: '#A84635',
            colorPrimaryActive: '#8E3A2C',
            defaultBg: '#FFFFFF',
            defaultBorderColor: '#E0D9CC',
            defaultColor: '#2D2A26',
            defaultHoverBorderColor: '#C8553D',
            defaultHoverColor: '#C8553D',
            primaryShadow: '0 2px 0 rgba(200, 85, 61, 0.06)',
          },
          Tabs: {
            itemColor: '#5C5852',
            itemHoverColor: '#C8553D',
            itemSelectedColor: '#C8553D',
            itemActiveColor: '#A84635',
            inkBarColor: '#C8553D',
            titleFontSize: 14,
          },
          Input: {
            colorBgContainer: '#FFFFFF',
            colorBorder: '#E0D9CC',
            hoverBorderColor: '#C8553D',
            activeBorderColor: '#C8553D',
            activeShadow: '0 0 0 2px rgba(200, 85, 61, 0.1)',
          },
          Select: {
            colorBgContainer: '#FFFFFF',
            colorBorder: '#E0D9CC',
            optionSelectedBg: '#FBEEEA',
            optionSelectedColor: '#A84635',
          },
          Slider: {
            handleColor: '#C8553D',
            handleActiveColor: '#A84635',
            trackBg: '#C8553D',
            trackHoverBg: '#A84635',
            railBg: '#EDE7DA',
            railHoverBg: '#E0D9CC',
          },
          Switch: {
            colorPrimary: '#C8553D',
            colorPrimaryHover: '#A84635',
          },
          Steps: {
            colorPrimary: '#C8553D',
            colorText: '#2D2A26',
            colorTextDescription: '#5C5852',
            iconSize: 28,
            titleLineHeight: 1.5,
          },
          Tag: {
            defaultBg: '#EDE7DA',
            defaultColor: '#5C5852',
          },
          Table: {
            headerBg: '#FAF7F1',
            headerColor: '#5C5852',
            borderColor: '#D6CFC1',
            rowHoverBg: '#FAF7F1',
          },
          Radio: {
            colorPrimary: '#C8553D',
            buttonCheckedBg: '#FBEEEA',
            buttonSolidCheckedColor: '#A84635',
            buttonColor: '#5C5852',
          },
          Checkbox: {
            colorPrimary: '#C8553D',
            colorPrimaryHover: '#A84635',
          },
          Segmented: {
            itemActiveBg: '#FFFFFF',
            itemHoverBg: '#FAF7F1',
            itemSelectedBg: '#FFFFFF',
            itemSelectedColor: '#C8553D',
            trackBg: '#EDE7DA',
          },
          Progress: {
            defaultColor: '#C8553D',
            remainingColor: '#EDE7DA',
          },
        },
      }}
    >
      <App />
    </ConfigProvider>
  </React.StrictMode>
);
