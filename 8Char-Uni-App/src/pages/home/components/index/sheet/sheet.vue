<template>
  <view>
    <yx-sheet :margin="[32, 30]" :round="3">
      <u-form :model="form">

        <u-form-item :border-bottom="false">
          <yx-input v-model="form.realname" border placeholder="请输入姓名（可空）">
            <template #icon>
              <u-icon name="account-fill"></u-icon>
            </template>
          </yx-input>
        </u-form-item>

        <u-form-item :border-bottom="false">
          <u-row style="width: 100%;">
            <u-col :span="6">
              <u-radio-group v-model="form.gender">
                <u-radio v-for="item in options.gender" :name="item.value">{{ item.label }}</u-radio>
              </u-radio-group>
            </u-col>
            <u-col :span="6">
              <u-subsection v-model="form.model" :list="options.model" @change="handleSubSectionChange"></u-subsection>
            </u-col>
          </u-row>
        </u-form-item>

        <u-form-item :border-bottom="false">
          <yx-input v-model="form.datetimeLabel" margin="12" disabled placeholder="请选择时间" @click="SelectTime">
            <template #icon>
              <u-icon name="calendar-fill"></u-icon>
            </template>
          </yx-input>
        </u-form-item>

        <u-form-item v-if="form.lunarLabel" :border-bottom="false">
          <yx-input v-model="form.lunarLabel" margin="12" disabled>
            <template #icon>
              <u-icon name="tags-fill"></u-icon>
            </template>
          </yx-input>
        </u-form-item>

        <u-form-item :border-bottom="false">
          <u-radio-group v-model="form.sect">
            <u-radio v-for="item in options.sect" :name="item.value">{{ item.label }}</u-radio>
          </u-radio-group>
        </u-form-item>

        <u-button class="u-m-t-10 u-m-b-10" type="primary" @click="Sumbit">开始排盘</u-button>

      </u-form>
    </yx-sheet>

    <yx-pillar-picker ref="pillarPicker" :default-value="pillarDefaultValue" @confirm="PillarConfirm"></yx-pillar-picker>
    <u-picker
        v-model="solarSelectShow"
        :params="options.timePicker"
        :default-time="form.defaultTime"
        mode="time"
        start-year="1900"
        end-year="2100"
        @confirm="SolarConfirm"
    ></u-picker>
  </view>
</template>

<script setup>
import {reactive, ref, watch} from "vue";
import {onLoad} from "@dcloudio/uni-app";
import {Solar} from "lunar-javascript";
import {deleteLocalStorage, getLocalStorage, setLocalStorage} from "@/utils/cache";
import {GetBook, GetInfo} from "@/api/default";
import {calculateBaziWithWS} from "@/api/websocket";
import {useDetailStore} from "@/store/detail";
import {firstStringToUpperCase, timeFormat} from "@/utils/transform";
import {toDetail} from "@/utils/router";
import {useTendStore} from "@/store/tend";
import {PILLAR_FIELD} from "@/config/map";
import {useBookStore} from "@/store/book";

const options = ref({
  gender:[{value:1,label:'男'},{value:2,label:'女'},],
  model:[{ name: '阴历' }, { name: '四柱' }],
  sect:[{value:1,label:'晚子时日柱算明天'},{value:2,label:'晚子时日柱算当天'},],
  timePicker:{
    year: true,
    month: true,
    day: true,
    hour: true,
    minute: true,
    second: false
  }
})

const form = reactive({
  realname: "",
  gender: 1,
  model: 0,
  sect: 1,
  timestamp: null,
  defaultTime:"2001-01-01 00:00:00",
  datetimeLabel: null,
  lunarLabel: null,
})

const detailStore = useDetailStore();
const tendStore = useTendStore();
const bookStore = useBookStore();

const solarSelectShow = ref(false);

const solarDefaultValue = ref("");
const pillarDefaultValue = ref("");

const pillarPicker = ref()

const handleSubSectionChange = index=>{
  form.model = index
}

watch(() => [form.model, form.timestamp], () => {
  PullDatatimeLabel()
});

onLoad((e) => {
  if (e.time) {
    form.timestamp = parseInt(e.time);
    form.gender = e.gender === 1 ? 1 : 2;
  } else {
    const cache = getLocalStorage("info");
    if (cache) {
      let data = null;
      try {
        data = JSON.parse(cache);
        form.realname = data.realname;
        form.gender = data.gender === 1 ? 1 : 2;
        form.timestamp = data.timestamp;
        form.sect = data.sect ?? 1;
      } catch (e) {
        deleteLocalStorage("info");
      }
    }
  }

  form.defaultTime = uni.$u.date(form.timestamp,"yyyy-mm-dd hh:MM:ss")
});

function SelectTime() {
  const type = form.model;
  if (type === 0) {
    solarSelectShow.value = true;
  } else if (type === 1) {
    pillarPicker.value.open();
  }
}

const SolarConfirm = (params) => {
  const {year, month, day, hour, minute} = params
  const time = `${year}/${month}/${day} ${hour}:${minute}`;
  form.timestamp = new Date(time).getTime();
}
const PillarConfirm = (e) => {
  form.timestamp = e.value;
  pillarPicker.value.close();
};

function PullDatatimeLabel() {
  const time = form.timestamp;
  if (time === null) return;
  const index = form.model;
  const solar = Solar.fromDate(new Date(time));
  const lunar = solar.getLunar();
  form.lunarLabel = `${lunar.toString()} ${lunar.getTimeZhi()}时`;
  if (index === 0) {
    const date = timeFormat(time);
    form.datetimeLabel = date;
    solarDefaultValue.value = date;
  } else {
    const bazi = lunar.getEightChar();
    form.datetimeLabel = bazi.toString();
    const list = [].fill("");
    for(let i = 0;i < PILLAR_FIELD.length; i++){
      const type = PILLAR_FIELD[i]
      list[i] = bazi[`get${firstStringToUpperCase(type)}Gan`]();
      list[i+4] = bazi[`get${firstStringToUpperCase(type)}Zhi`]();
    }
    pillarDefaultValue.value = list.join("");
  }
}


async function Sumbit() {
  const datetime = form.timestamp;
  if (datetime === null) {
    SelectTime();
    return;
  }
  const name = uni.$u.test.isEmpty(form.realname) ? "不知名网友" : form.realname;

  const payload = {
    realname: name,
    timestamp: datetime,
    gender: form.gender,
    sect: form.sect,
  }

  // 显示初始加载提示
  uni.showLoading({
    title: "开始计算..."
  })

  detailStore.set(payload)
  setLocalStorage("info", JSON.stringify(payload));

  try {
      // 使用 WebSocket 计算八字（实时进度）
      const wsData = {
        datetime: uni.$u.date(datetime, "yyyy-mm-dd hh:MM:ss"),
        gender: form.gender,
        sect: form.sect
      };

      await calculateBaziWithWS(
        wsData,
        // 进度回调 - 更新加载提示
        (progress, message) => {
          uni.hideLoading();
          uni.showLoading({
            title: `${message} (${progress}%)`
          });
        },
        // 完成回调 - 处理返回数据
        async (data) => {
          uni.hideLoading();
          uni.showLoading({
            title: "正在获取古籍..."
          });

          // WebSocket 返回的数据格式：data.result 包含完整的八字数据
          // 与 HTTP API 返回的格式一致，直接使用
          if (data && data.result) {
            // WebSocket 返回格式：{ result: baziData }
            detailStore.set(data.result);
          } else if (data) {
            // 如果直接返回八字数据（兼容处理）
            detailStore.set(data);
          } else {
            throw new Error('返回数据格式错误');
          }

          // 获取古籍信息（继续使用 HTTP，失败不影响排盘）
          // 使用异步方式，不阻塞排盘流程
          GetBook(detailStore.defaultPayload)
            .then(res => {
              bookStore.set(res);
            })
            .catch(err => {
              // 古籍获取失败不影响排盘，只记录错误
              console.warn('获取命盘古籍失败，但不影响排盘:', err);
            });

          // 无论古籍是否获取成功，都继续排盘流程
          uni.hideLoading();
          tendStore.pull(payload);
          toDetail();
        },
        // 错误回调
        (error) => {
          uni.hideLoading();
          setTimeout(() => {
            uni.$u.toast(`获取命盘信息失败：${error}`, 3000);
          }, 800);
        }
      );

  } catch (error) {
    uni.hideLoading();
    setTimeout(() => {
      uni.$u.toast("获取命盘信息失败！", 3000);
    }, 800);
  }
}
</script>

<style scoped>
.u-form-item {
  padding: 0.375rem 0;
}
</style>
