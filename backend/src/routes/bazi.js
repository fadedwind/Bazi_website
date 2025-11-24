const express = require('express');
const router = express.Router();
const axios = require('axios');

// 数据库相关模块（可选，如果数据库未配置则跳过）
let pool = null;
let saveQueryRecord = null;

try {
  pool = require('../config/database');
  const recordUtils = require('../utils/record');
  saveQueryRecord = recordUtils.saveQueryRecord;
} catch (error) {
  console.warn('⚠️  数据库模块加载失败，数据库功能将不可用');
}

// 原始API地址（作为备用）
const ORIGINAL_API = 'https://api.app.yxbug.cn/api';

// 获取提示信息
router.get('/get-tips', async (req, res) => {
  try {
    // 可以返回自定义提示，或调用原接口
    const response = await axios.get(`${ORIGINAL_API}/8char/get-tips`);
    res.json({
      code: 200,
      msg: 'success',
      data: response.data
    });
  } catch (error) {
    console.error('获取提示失败:', error);
    res.json({
      code: 200,
      msg: 'success',
      data: { tips: '请输入正确的出生信息进行排盘' }
    });
  }
});

// 获取版本信息
router.get('/get-version', async (req, res) => {
  try {
    const response = await axios.get(`${ORIGINAL_API}/8char/get-version`);
    res.json({
      code: 200,
      msg: 'success',
      data: response.data
    });
  } catch (error) {
    res.json({
      code: 200,
      msg: 'success',
      data: { version: '1.0.0' }
    });
  }
});

// 获取八字信息（核心接口）
router.post('/get-info', async (req, res) => {
  try {
    const { datetime, gender, sect } = req.body;
    
    if (!datetime) {
      return res.json({
        code: 400,
        msg: '缺少必要参数',
        data: null
      });
    }

    // 使用本地八字计算服务
    const BaziService = require('../services/baziService');
    const baziData = BaziService.calculateBazi(datetime, gender || 1, sect || 0);

    // 保存查询记录到数据库（如果数据库可用）
    if (saveQueryRecord) {
      try {
        await saveQueryRecord({
          datetime,
          gender: gender || 1,
          sect: sect || 0,
          query_type: 'get_info',
          ip: req.ip || req.headers['x-forwarded-for'] || 'unknown'
        });
      } catch (dbError) {
        console.warn('保存查询记录失败（不影响主流程）:', dbError.message);
      }
    }

    res.json({
      code: 200,
      msg: 'success',
      data: baziData
    });
  } catch (error) {
    console.error('获取八字信息失败:', error);
    
    // 如果本地计算失败，尝试使用原始API作为备用
    try {
      const response = await axios.post(`${ORIGINAL_API}/8char/get-info`, {
        datetime,
        gender: gender || 1,
        sect: sect || 0
      });
      res.json({
        code: 200,
        msg: 'success',
        data: response.data
      });
    } catch (fallbackError) {
      res.json({
        code: 500,
        msg: error.message || '获取八字信息失败',
        data: null
      });
    }
  }
});

// 获取古籍参考
router.post('/get-book', async (req, res) => {
  try {
    const response = await axios.post(`${ORIGINAL_API}/8char/get-book`, req.body);
    res.json({
      code: 200,
      msg: 'success',
      data: response.data
    });
  } catch (error) {
    console.error('获取古籍参考失败:', error);
    res.json({
      code: 500,
      msg: error.message || '获取古籍参考失败',
      data: null
    });
  }
});

// 获取预测信息
router.post('/get-prediction', async (req, res) => {
  try {
    const response = await axios.post(`${ORIGINAL_API}/8char/get-prediction`, req.body);
    res.json({
      code: 200,
      msg: 'success',
      data: response.data
    });
  } catch (error) {
    console.error('获取预测信息失败:', error);
    res.json({
      code: 500,
      msg: error.message || '获取预测信息失败',
      data: null
    });
  }
});

module.exports = router;

