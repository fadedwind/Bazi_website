/**
 * 八字排盘服务
 * 使用 lunar-javascript 库实现真实的八字计算
 */
const { Solar, LunarUtil } = require('lunar-javascript');

class BaziService {
  /**
   * 计算八字信息
   * @param {string} datetime - 出生时间，格式：YYYY-MM-DD HH:mm:ss
   * @param {number} gender - 性别：1-男，2-女
   * @param {number} sect - 流派：0-默认
   * @returns {Object} 八字数据
   */
  static calculateBazi(datetime, gender = 1, sect = 0) {
    try {
      // 解析时间
      const date = new Date(datetime);
      if (isNaN(date.getTime())) {
        throw new Error('时间格式错误');
      }

      // 从公历转换为农历
      const solar = Solar.fromDate(date);
      const lunar = solar.getLunar();
      const bazi = lunar.getEightChar();

      // 获取四柱（年月日时）
      const pillars = {
        year: {
          gan: bazi.getYearGan(),
          zhi: bazi.getYearZhi(),
          ganIndex: lunar.getYearGanIndex(),
          zhiIndex: lunar.getYearZhiIndex()
        },
        month: {
          gan: bazi.getMonthGan(),
          zhi: bazi.getMonthZhi(),
          ganIndex: lunar.getMonthGanIndex(),
          zhiIndex: lunar.getMonthZhiIndex()
        },
        day: {
          gan: bazi.getDayGan(),
          zhi: bazi.getDayZhi(),
          ganIndex: lunar.getDayGanIndex(),
          zhiIndex: lunar.getDayZhiIndex()
        },
        time: {
          gan: bazi.getTimeGan(),
          zhi: bazi.getTimeZhi(),
          ganIndex: lunar.getTimeGanIndex(),
          zhiIndex: lunar.getTimeZhiIndex()
        }
      };

      // 获取藏干（地支藏干）
      const bottomHide = {
        year: LunarUtil.ZHI_HIDE_GAN[pillars.year.zhi] || [],
        month: LunarUtil.ZHI_HIDE_GAN[pillars.month.zhi] || [],
        day: LunarUtil.ZHI_HIDE_GAN[pillars.day.zhi] || [],
        time: LunarUtil.ZHI_HIDE_GAN[pillars.time.zhi] || []
      };

      // 获取空亡
      const empty = {
        year: LunarUtil.XUN_KONG[LunarUtil.getXunIndex(pillars.year.gan + pillars.year.zhi)] || '',
        month: LunarUtil.XUN_KONG[LunarUtil.getXunIndex(pillars.month.gan + pillars.month.zhi)] || '',
        day: LunarUtil.XUN_KONG[LunarUtil.getXunIndex(pillars.day.gan + pillars.day.zhi)] || '',
        time: LunarUtil.XUN_KONG[LunarUtil.getXunIndex(pillars.time.gan + pillars.time.zhi)] || ''
      };

      // 获取纳音
      const nayin = {
        year: LunarUtil.NAYIN[pillars.year.gan + pillars.year.zhi] || '',
        month: LunarUtil.NAYIN[pillars.month.gan + pillars.month.zhi] || '',
        day: LunarUtil.NAYIN[pillars.day.gan + pillars.day.zhi] || '',
        time: LunarUtil.NAYIN[pillars.time.gan + pillars.time.zhi] || ''
      };

      // 获取十神关系
      const dayGan = pillars.day.gan;
      const dayGanIndex = pillars.day.ganIndex;
      const shishen = {
        year: this.getShiShen(dayGan, dayGanIndex, pillars.year.gan, pillars.year.ganIndex),
        month: this.getShiShen(dayGan, dayGanIndex, pillars.month.gan, pillars.month.ganIndex),
        day: '日主',
        time: this.getShiShen(dayGan, dayGanIndex, pillars.time.gan, pillars.time.ganIndex)
      };

      // 计算主星（天干十神）
      const main = {
        year: shishen.year,
        month: shishen.month,
        day: gender === 1 ? '元男' : '元女', // 日主显示元男或元女
        time: shishen.time
      };

      // 计算副星（藏干十神）- 每个地支的藏干对应的十神
      const assiste = {
        year: bottomHide.year.map(gan => {
          const ganIndex = LunarUtil.GAN.indexOf(gan);
          return ganIndex >= 0 ? this.getShiShen(dayGan, dayGanIndex, gan, ganIndex) : '';
        }),
        month: bottomHide.month.map(gan => {
          const ganIndex = LunarUtil.GAN.indexOf(gan);
          return ganIndex >= 0 ? this.getShiShen(dayGan, dayGanIndex, gan, ganIndex) : '';
        }),
        day: bottomHide.day.map(gan => {
          const ganIndex = LunarUtil.GAN.indexOf(gan);
          return ganIndex >= 0 ? this.getShiShen(dayGan, dayGanIndex, gan, ganIndex) : '';
        }),
        time: bottomHide.time.map(gan => {
          const ganIndex = LunarUtil.GAN.indexOf(gan);
          return ganIndex >= 0 ? this.getShiShen(dayGan, dayGanIndex, gan, ganIndex) : '';
        })
      };

      // 获取生肖
      const zodiac = lunar.getYearShengXiao();

      // 获取星座
      const constellation = solar.getXingZuo();

      // 获取节气信息
      const jieQiTable = lunar.getJieQiTable();
      const festival = this.getFestivalInfo(jieQiTable, date);

      // 获取胎元、胎息、命宫、身宫
      const embryo = this.getEmbryoInfo(lunar, bazi);

      // 获取神煞
      const gods = this.getGods(lunar, bazi);

      // 获取五行信息
      const element = this.getElementInfo(pillars, bottomHide);

      // 获取大运信息（简化版）
      const dayun = this.getDayunInfo(lunar, gender, bazi);

      // 构建返回数据（匹配前端期望的格式）
      return {
        datetime: {
          solar: solar.toYmdHms(),
          lunar: lunar.toString()
        },
        festival: festival,
        constellation: constellation,
        zodiac: zodiac,
        top: {
          year: pillars.year.gan,
          month: pillars.month.gan,
          day: pillars.day.gan,
          time: pillars.time.gan
        },
        bottom: {
          year: pillars.year.zhi,
          month: pillars.month.zhi,
          day: pillars.day.zhi,
          time: pillars.time.zhi
        },
        bottom_hide: bottomHide,
        empty: empty,
        nayin: nayin,
        element: element,
        shishen: shishen,
        embryo: embryo,
        gods: gods,
        dayun: dayun,
        start_tend: this.getStartTend(lunar, gender),
        start: {
          main: main,      // 主星（天干十神）
          assiste: assiste // 副星（地支十神）
        }
      };
    } catch (error) {
      console.error('八字计算错误:', error);
      throw new Error(`八字计算失败: ${error.message}`);
    }
  }

  /**
   * 获取十神（天干）
   */
  static getShiShen(dayGan, dayGanIndex, targetGan, targetGanIndex) {
    const diff = (targetGanIndex - dayGanIndex + 10) % 10;
    const shishenMap = {
      0: '比肩',
      1: '劫财',
      2: '食神',
      3: '伤官',
      4: '偏财',
      5: '正财',
      6: '七杀',
      7: '正官',
      8: '偏印',
      9: '正印'
    };
    return shishenMap[diff] || '';
  }

  /**
   * 获取十神（地支）
   */
  static getShiShenForZhi(dayGan, zhi) {
    // 地支十神映射表（与前端保持一致）
    const SHI_SHEN_ZHI = {
      甲子: "正印", 甲丑: "正财", 甲寅: "比肩", 甲卯: "劫财", 甲辰: "偏财", 甲巳: "食神", 甲午: "伤官", 甲未: "正财", 甲申: "七杀", 甲酉: "正官", 甲戌: "偏财", 甲亥: "偏印",
      乙子: "偏印", 乙丑: "偏财", 乙寅: "劫财", 乙卯: "比肩", 乙辰: "正财", 乙巳: "伤官", 乙午: "食神", 乙未: "偏财", 乙申: "正官", 乙酉: "七杀", 乙戌: "正财", 乙亥: "正印",
      丙子: "正官", 丙丑: "伤官", 丙寅: "偏印", 丙卯: "正印", 丙辰: "食神", 丙巳: "比肩", 丙午: "劫财", 丙未: "伤官", 丙申: "偏财", 丙酉: "正财", 丙戌: "食神", 丙亥: "七杀",
      丁子: "七杀", 丁丑: "食神", 丁寅: "正印", 丁卯: "偏印", 丁辰: "伤官", 丁巳: "劫财", 丁午: "比肩", 丁未: "食神", 丁申: "正财", 丁酉: "偏财", 丁戌: "伤官", 丁亥: "正官",
      戊子: "正财", 戊丑: "劫财", 戊寅: "七杀", 戊卯: "正官", 戊辰: "比肩", 戊巳: "偏印", 戊午: "正印", 戊未: "劫财", 戊申: "食神", 戊酉: "伤官", 戊戌: "比肩", 戊亥: "偏财",
      己子: "偏财", 己丑: "比肩", 己寅: "正官", 己卯: "七杀", 己辰: "劫财", 己巳: "正印", 己午: "偏印", 己未: "比肩", 己申: "伤官", 己酉: "食神", 己戌: "劫财", 己亥: "正财",
      庚子: "伤官", 庚丑: "正印", 庚寅: "偏财", 庚卯: "正财", 庚辰: "偏印", 庚巳: "七杀", 庚午: "正官", 庚未: "正印", 庚申: "比肩", 庚酉: "劫财", 庚戌: "偏印", 庚亥: "食神",
      辛子: "食神", 辛丑: "偏印", 辛寅: "正财", 辛卯: "偏财", 辛辰: "正印", 辛巳: "正官", 辛午: "七杀", 辛未: "偏印", 辛申: "劫财", 辛酉: "比肩", 辛戌: "正印", 辛亥: "伤官",
      壬子: "劫财", 壬丑: "正官", 壬寅: "食神", 壬卯: "伤官", 壬辰: "七杀", 壬巳: "偏财", 壬午: "正财", 壬未: "正官", 壬申: "偏印", 壬酉: "正印", 壬戌: "七杀", 壬亥: "比肩",
      癸子: "比肩", 癸丑: "七杀", 癸寅: "伤官", 癸卯: "食神", 癸辰: "正官", 癸巳: "正财", 癸午: "偏财", 癸未: "七杀", 癸申: "正印", 癸酉: "偏印", 癸戌: "正官", 癸亥: "劫财"
    };
    return SHI_SHEN_ZHI[dayGan + zhi] || '';
  }

  /**
   * 获取节气信息
   */
  static getFestivalInfo(jieQiTable, date) {
    const jieqiList = ['立春', '惊蛰', '清明', '立夏', '芒种', '小暑', 
                      '立秋', '白露', '寒露', '立冬', '大雪', '小寒'];
    
    let preJieqi = null;
    let nextJieqi = null;
    let preTime = '';
    let nextTime = '';

    const currentDate = date.toISOString().split('T')[0].replace(/-/g, '');
    for (let i = 0; i < jieqiList.length; i++) {
      const jieqi = jieqiList[i];
      const jieqiSolar = jieQiTable[jieqi];
      if (jieqiSolar) {
        const jieqiDate = jieqiSolar.toYmd().replace(/-/g, '');
        
        if (jieqiDate <= currentDate) {
          preJieqi = jieqi;
          preTime = jieqiSolar.toYmd();
        } else if (!nextJieqi) {
          nextJieqi = jieqi;
          nextTime = jieqiSolar.toYmd();
          break;
        }
      }
    }

    return {
      pre: {
        label: preJieqi || '未知',
        time: preTime
      },
      next: {
        label: nextJieqi || '未知',
        time: nextTime
      }
    };
  }

  /**
   * 获取胎元、胎息、命宫、身宫
   */
  static getEmbryoInfo(lunar, bazi) {
    // 胎元：月干进一位，月支进三位
    const monthGanIndex = lunar.getMonthGanIndex();
    const monthZhiIndex = lunar.getMonthZhiIndex();
    const taiyuanGan = LunarUtil.GAN[(monthGanIndex + 1) % 10];
    const taiyuanZhi = LunarUtil.ZHI[(monthZhiIndex + 3) % 12];
    const taiyuan = taiyuanGan + taiyuanZhi;

    // 胎息：日干进一位，日支进一位
    const dayGanIndex = lunar.getDayGanIndex();
    const dayZhiIndex = lunar.getDayZhiIndex();
    const taixiGan = LunarUtil.GAN[(dayGanIndex + 1) % 10];
    const taixiZhi = LunarUtil.ZHI[(dayZhiIndex + 1) % 12];
    const taixi = taixiGan + taixiZhi;

    // 命宫：简化计算
    const minggong = this.calculateMingGong(bazi);

    // 身宫：简化计算
    const shengong = this.calculateShenGong(bazi);

    return [
      [taiyuan, LunarUtil.NAYIN[taiyuan] || ''],
      [taixi, LunarUtil.NAYIN[taixi] || ''],
      [minggong, LunarUtil.NAYIN[minggong] || ''],
      [shengong, LunarUtil.NAYIN[shengong] || '']
    ];
  }

  /**
   * 计算命宫
   */
  static calculateMingGong(bazi) {
    // 简化算法：根据月支和时支计算
    const lunar = bazi.getLunar();
    const monthZhiIndex = lunar.getMonthZhiIndex();
    const timeZhiIndex = lunar.getTimeZhiIndex();
    const minggongZhiIndex = (12 - monthZhiIndex + timeZhiIndex) % 12;
    const minggongZhi = LunarUtil.ZHI[minggongZhiIndex];
    // 命宫天干根据年干和命宫地支计算
    const yearGanIndex = lunar.getYearGanIndex();
    const minggongGanIndex = (yearGanIndex + (minggongZhiIndex - lunar.getYearZhiIndex() + 12) % 12) % 10;
    const minggongGan = LunarUtil.GAN[minggongGanIndex];
    return minggongGan + minggongZhi;
  }

  /**
   * 计算身宫
   */
  static calculateShenGong(bazi) {
    // 简化算法：身宫与命宫相对
    const lunar = bazi.getLunar();
    const monthZhiIndex = lunar.getMonthZhiIndex();
    const timeZhiIndex = lunar.getTimeZhiIndex();
    const shengongZhiIndex = (12 - timeZhiIndex + monthZhiIndex) % 12;
    const shengongZhi = LunarUtil.ZHI[shengongZhiIndex];
    const yearGanIndex = lunar.getYearGanIndex();
    const shengongGanIndex = (yearGanIndex + (shengongZhiIndex - lunar.getYearZhiIndex() + 12) % 12) % 10;
    const shengongGan = LunarUtil.GAN[shengongGanIndex];
    return shengongGan + shengongZhi;
  }

  /**
   * 获取神煞
   */
  static getGods(lunar, bazi) {
    // 简化版神煞计算
    const gods = [];
    // 这里可以添加更多神煞计算逻辑
    return gods;
  }

  /**
   * 获取五行信息
   */
  static getElementInfo(pillars, bottomHide) {
    const wuxing = { 金: 0, 木: 0, 水: 0, 火: 0, 土: 0 };
    
    // 统计天干五行
    Object.values(pillars).forEach(pillar => {
      const ganWuxing = LunarUtil.WU_XING_GAN[pillar.gan];
      if (ganWuxing) wuxing[ganWuxing]++;
    });

    // 统计地支五行
    Object.values(pillars).forEach(pillar => {
      const zhiWuxing = LunarUtil.WU_XING_ZHI[pillar.zhi];
      if (zhiWuxing) wuxing[zhiWuxing]++;
    });

    // 统计藏干五行
    Object.values(bottomHide).forEach(hides => {
      hides.forEach(gan => {
        const ganWuxing = LunarUtil.WU_XING_GAN[gan];
        if (ganWuxing) wuxing[ganWuxing]++;
      });
    });

    return {
      relation: Object.entries(wuxing).map(([name, count]) => ({ name, count })),
      pro_decl: ['', '', '', '', ''], // 需要更复杂的计算
      include: [],
      ninclude: []
    };
  }

  /**
   * 获取大运信息
   */
  static getDayunInfo(lunar, gender, bazi) {
    // 简化版大运计算
    const dayunList = [];
    // 这里可以添加完整的大运计算逻辑
    return dayunList;
  }

  /**
   * 获取起运时间
   */
  static getStartTend(lunar, gender) {
    // 简化版起运时间计算
    return {
      year: '',
      month: '',
      day: '',
      time: ''
    };
  }
}

module.exports = BaziService;

