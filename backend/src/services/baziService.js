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
        start_tend: this.getStartTend(lunar, gender)
      };
    } catch (error) {
      console.error('八字计算错误:', error);
      throw new Error(`八字计算失败: ${error.message}`);
    }
  }

  /**
   * 获取十神
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

