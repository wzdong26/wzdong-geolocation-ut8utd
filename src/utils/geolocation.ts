/**
 * @title geolocation
 * @author wzdong26
 * @description 基于H5、高德、百度、腾讯定位API封装
 */

// 地理定位器枚举类型：H5、高德、百度、腾讯
export enum GeolocatorType {
  H5 = 1,
  GD,
  BD,
  TX,
}
// 定位错误码
export enum GeolocationErrorCode {
  PERMISSION_DENIED = 1,
  POSITION_UNAVAILABLE,
  TIMEOUT,
  LOWER_ACCURACY,
  UNKNOW_ERROR,
}

// 地理定位函数入参选项
interface IGeolocationOptions {
  accuracyThreshold?: number; // 精度阈值，取低于该阈值的定位结果
  maximumAge?: number; // 浏览器原生定位的缓存时间，毫秒
  timeout?: number; // 定位的超时时间，毫秒
}

// 地理定位返回结果类型
interface IGeolocationResult {
  readonly accuracy: number; // 定位精度，米。
  readonly address?: any;
  readonly coords: {
    lng: number;
    lat: number;
  };
  readonly heading?: number | null; // 设备移动方向，度。0-359，由北顺时针方向，speed为0时，heading为null
  readonly speed?: number | null; // 设备移动速度，m/s。可以为null
  readonly timestamp: number;
  readonly geolocatorType?: GeolocatorType | null;
  readonly pois?: any[];
  readonly roads?: any[];
  readonly crosses?: number;
}

// 地理定位报错类型
interface IGeolocationError {
  readonly code: GeolocationErrorCode;
  readonly msg: string;
  readonly message?: string;
}

// 地理定位函数类型
interface IGeolocation {
  (
    options?: IGeolocationOptions,
    geolocator?: GeolocatorType
  ): Promise<IGeolocationResult>;
}

// 高德地理定位返回结果类型, https://lbs.amap.com/api/jsapi-v2/documentation#geolocationresult
interface IGDGeolocationResult {
  readonly position: {
    lng: number;
    lat: number;
  };
  readonly heading: number | null;
  readonly speed: number | null;
  readonly accuracy: number;
  readonly location_type: string;
  readonly message: string;
  readonly isConverted: boolean;
  readonly info: string;
  readonly addressComponent: any;
  readonly formattedAddress: string;
  readonly aois: any[];
  readonly pois: any[];
  readonly roads: any[];
  readonly crosses: any[];
}
// 百度地理定位返回结果类型, https://mapopen-pub-jsapi.bj.bcebos.com/jsapi/reference/jsapi_webgl_1_0.html#a8b41
interface IBDGeolocationResult {
  readonly point: {
    lng: number;
    lat: number;
  };
  readonly heading: number | null;
  readonly speed: number | null;
  readonly accuracy: number;
  readonly address: string;
  readonly timestamp: number | null;
}
// 腾讯地理定位返回结果类型, https://lbs.qq.com/webApi/component/componentGuide/componentGeolocation
interface ITXGeolocationResult {
  readonly module: string;
  readonly nation: string;
  readonly province: string;
  readonly city: string;
  readonly district: string;
  readonly adcode: string;
  readonly addr: string;
  readonly lat: number;
  readonly lng: number;
  readonly accuracy: number | null;
}

// <script async /> 引入GD\BD\TX jsapi
const jsapiKey = {
  [GeolocatorType.GD]: '71439ace8cb4ad59f22bc3e07267fef0',
  [GeolocatorType.BD]: 'OsxPdYYCZlnhoar9L42cbLvzXxHYi6aR',
  [GeolocatorType.TX]: 'A4DBZ-MBZWI-OWOG2-5DHIO-HAGNQ-ZKFKG',
};
const createScriptTag = (src: string) => {
  if (document.querySelectorAll(`script[src*="${src}"]`).length) return;
  const scriptTag: HTMLScriptElement = document.createElement('script');
  scriptTag.src = src;
  document.head.appendChild(scriptTag);
};
const loadGdApi = (key: string) => {
  const src = `https://webapi.amap.com/maps?v=2.0&key=${key}&callback=onGdJsApiLoad`;
  (window as any).onGdJsApiLoad = () => {
    if ((AMap = (window as any).AMap)) {
      console.log('Gd Js Api Load Success!', AMap);
    }
  };
  createScriptTag(src);
};
const loadBdApi = (ak: string) => {
  const src = `https://api.map.baidu.com/api?v=1.0&&type=webgl&ak=${ak}&callback=onBdJsApiLoad`;
  (window as any).onBdJsApiLoad = () => {
    if ((BMapGL = (window as any).BMapGL) && BMapGL.version === 'gl') {
      console.log('Bd Js Api Load Success!', BMapGL);
    }
  };
  createScriptTag(src);
};
const loadTxApi = (key: string) => {
  const src = `https://apis.map.qq.com/tools/geolocation/min?key=${key}&referer=myapp&callback=onTxJsApiLoad`;
  (window as any).onTxJsApiLoad = () => {
    if ((QMap = (window as any).qq.maps)) {
      console.log('Tx Js Api Load Success!', QMap);
    }
  };
  createScriptTag(src);
};
(() => {
  loadGdApi(jsapiKey[GeolocatorType.GD]);
  loadBdApi(jsapiKey[GeolocatorType.BD]);
  loadTxApi(jsapiKey[GeolocatorType.TX]);
})();

const generateErrorMsg = (
  code: GeolocationErrorCode,
  message?: string
): IGeolocationError => {
  const {
    PERMISSION_DENIED,
    POSITION_UNAVAILABLE,
    TIMEOUT,
    LOWER_ACCURACY,
    UNKNOW_ERROR,
  } = GeolocationErrorCode;
  const errcodeMsgMap = {
    [PERMISSION_DENIED]: '未开启定位权限',
    [POSITION_UNAVAILABLE]: '定位不可用',
    [TIMEOUT]: '定位超时',
    [LOWER_ACCURACY]: '定位精度太低',
    [UNKNOW_ERROR]: '定位失败',
  };
  return {
    code,
    msg: errcodeMsgMap[code],
    message,
  };
};

/**
 * @params timeout
 * @return Promise<IGeolocationResult>
 */

const h5Locate: IGeolocation = ({ timeout, maximumAge, accuracyThreshold }) =>
  new Promise((resolve, reject) => {
    const option = {
      enableHighAccuracy: true,
      timeout,
      maximumAge,
    };
    navigator.geolocation.getCurrentPosition(
      (data) => {
        const {
          coords: { accuracy, longitude: lng, latitude: lat, heading, speed },
          timestamp,
        } = data;
        if (accuracy > (accuracyThreshold ?? Number.MAX_VALUE)) {
          reject(
            generateErrorMsg(
              GeolocationErrorCode.LOWER_ACCURACY,
              `lng: ${lng}, lat: ${lat}, accuracy: ${accuracy}`
            )
          );
        }
        const geolocatorType = GeolocatorType.H5;
        resolve({
          accuracy,
          geolocatorType,
          coords: { lng, lat },
          heading,
          speed,
          timestamp,
        });
      },
      (err) => {
        switch (err.code) {
          case err.PERMISSION_DENIED:
            reject(
              generateErrorMsg(
                GeolocationErrorCode.PERMISSION_DENIED,
                err.message
              )
            );
            break;
          case err.POSITION_UNAVAILABLE:
            reject(
              generateErrorMsg(
                GeolocationErrorCode.POSITION_UNAVAILABLE,
                err.message
              )
            );
            break;
          case err.TIMEOUT:
            reject(generateErrorMsg(GeolocationErrorCode.TIMEOUT, err.message));
            break;
          default:
            reject(
              generateErrorMsg(GeolocationErrorCode.UNKNOW_ERROR, err.message)
            );
            break;
        }
      },
      option
    );
  });

let AMap: any = (window as any).AMap;
const gdLocate: IGeolocation = ({ timeout, maximumAge, accuracyThreshold }) =>
  new Promise((resolve, reject) => {
    const option = {
      convert: false, // 是否将定位结果转换为高德坐标
      enableHighAccuracy: true, // 是否使用高精度定位，默认:true
      needAddress: true, // 是否需要将定位结果进行逆地理编码操作
      extensions: 'all', // 是否需要详细的逆地理编码信息，默认为'base'只返回基本信息，可选'all'
      useNative: true, // 是否与高德定位SDK能力结合，需要同时使用安卓版高德定位sdk，否则无效
      showMarker: false, // 是否显示定位点
      showCircle: false, // 是否显示定位精度圆
      showButton: false, // 是否显示定位按钮
      panToLocation: false, // 定位成功后是否自动移动到响应位置
      zoomToAccuracy: false, // 定位成功后是否自动调整地图视野到定位点
      timeout, // 超时事件，单位为毫秒。默认：无穷大
      maximumAge,
    };
    AMap.plugin('AMap.Geolocation', () => {
      new AMap.Geolocation(option).getCurrentPosition(
        (status: 'complete' | 'error', result: IGDGeolocationResult) => {
          if (status === 'complete') {
            const {
              accuracy,
              location_type,
              position: { lat, lng },
              heading,
              speed,
              addressComponent: address,
            } = result;
            if (accuracy > (accuracyThreshold ?? Number.MAX_VALUE)) {
              reject(
                generateErrorMsg(
                  GeolocationErrorCode.LOWER_ACCURACY,
                  `lng: ${lng}, lat: ${lat}, accuracy: ${accuracy}`
                )
              );
            }
            resolve({
              accuracy,
              geolocatorType: GeolocatorType.GD,
              coords: { lat, lng },
              address,
              heading,
              speed,
              timestamp: new Date().getTime(),
            });
          } else {
            const { info, message } = result;
            switch (info) {
              case 'PERMISSION_DENIED':
                reject(
                  generateErrorMsg(
                    GeolocationErrorCode.PERMISSION_DENIED,
                    message
                  )
                );
                break;
              case 'TIME_OUT':
                reject(generateErrorMsg(GeolocationErrorCode.TIMEOUT, message));
                break;
              case 'POSITION_UNAVAILABLE':
                reject(
                  generateErrorMsg(
                    GeolocationErrorCode.POSITION_UNAVAILABLE,
                    message
                  )
                );
                break;
              default:
                reject(
                  generateErrorMsg(GeolocationErrorCode.UNKNOW_ERROR, message)
                );
                break;
            }
          }
        }
      );
    });
  });

let BMapGL: any = (window as any).BMapGL;
const bdLocate: IGeolocation = ({ timeout, maximumAge, accuracyThreshold }) =>
  new Promise((resolve, reject) => {
    const option = {
      enableHighAccuracy: true, // 是否要求浏览器获取最佳效果，同浏览器定位接口参数。默认为false
      maximumAge, // 允许返回指定事件内的缓存结果，单位为毫秒。如果为0，则每次请求都获取最新的定位结果。默认为10分钟
      SDKLocation: true, // 是否开启SDK辅助定位, 仅当使用环境为移动web混合开发，且开启了定位sdk辅助定位功能后生效
      timeout, // 超时事件，单位为毫秒。默认为10秒
    };
    const geolocation = new BMapGL.Geolocation();
    geolocation.getCurrentPosition(function (result: IBDGeolocationResult) {
      switch (this.getStatus()) {
        case 0: // success
          const {
            accuracy,
            address,
            point: { lat, lng },
            heading,
            speed,
            timestamp: timeStamp,
          } = result;
          if (accuracy > (accuracyThreshold ?? Number.MAX_VALUE)) {
            reject(
              generateErrorMsg(
                GeolocationErrorCode.LOWER_ACCURACY,
                `lng: ${lng}, lat: ${lat}, accuracy: ${accuracy}`
              )
            );
          }
          resolve({
            accuracy,
            geolocatorType: GeolocatorType.BD,
            address,
            coords: { lat, lng },
            heading,
            speed,
            timestamp: timeStamp ?? new Date().getTime(),
          });
          break;
        case 6:
          reject(generateErrorMsg(GeolocationErrorCode.PERMISSION_DENIED));
          break;
        case 2:
          reject(generateErrorMsg(GeolocationErrorCode.POSITION_UNAVAILABLE));
          break;
        case 8:
          reject(generateErrorMsg(GeolocationErrorCode.TIMEOUT));
          break;
        default:
          reject(generateErrorMsg(GeolocationErrorCode.UNKNOW_ERROR));
          break;
      }
    }, option);
  });

let QMap: any = (window as any).qq?.maps;
const txLocate: IGeolocation = ({ timeout, accuracyThreshold }) =>
  new Promise((resolve, reject) => {
    const option = { timeout };
    const qmapGeolocation = new QMap.Geolocation();
    qmapGeolocation.getLocation(
      (result: ITXGeolocationResult) => {
        const {
          accuracy,
          addr,
          lat,
          lng,
          nation,
          province,
          city,
          district,
          adcode,
        } = result;
        if (accuracy > (accuracyThreshold ?? Number.MAX_VALUE)) {
          reject(
            generateErrorMsg(
              GeolocationErrorCode.LOWER_ACCURACY,
              `lng: ${lng}, lat: ${lat}, accuracy: ${accuracy}`
            )
          );
        }
        resolve({
          accuracy,
          geolocatorType: GeolocatorType.TX,
          address: {
            nation,
            province,
            city,
            district,
            adcode,
            addr,
          },
          coords: { lat, lng },
          timestamp: new Date().getTime(),
        });
      },
      (err) => {
        reject(err);
      },
      option
    );
  });

// 返回promiseList中从前往后能resolve的promise结果，如果所有promise都是reject，reject第一个promise的reason
const promiseFirst = <T>(...promiseList: Promise<T>[]): Promise<T> =>
  new Promise((resolve, reject) =>
    Promise.allSettled(promiseList).then((res) => {
      const fulfilledResult = res.find(({ status }) => status === 'fulfilled');
      if (fulfilledResult) {
        resolve(fulfilledResult.value);
      } else {
        reject(res[0].reason);
      }
    })
  );

const DEFAULT_OPTIONS = {
  timout: 8000,
  accuracyThreshold: 100,
  maximumAge: 0,
};
export const geolocation: IGeolocation = (options = {}, geolocator) => {
  options = {
    ...options,
    ...DEFAULT_OPTIONS,
  };
  switch (geolocator) {
    case GeolocatorType.H5:
      return promiseFirst(
        h5Locate(options),
        Promise.any([gdLocate, bdLocate, txLocate].map((fcn) => fcn(options)))
      );
    case GeolocatorType.GD:
      return promiseFirst(
        gdLocate(options),
        Promise.any([h5Locate, bdLocate, txLocate].map((fcn) => fcn(options)))
      );
    case GeolocatorType.BD:
      return promiseFirst(
        bdLocate(options),
        Promise.any([h5Locate, gdLocate, txLocate].map((fcn) => fcn(options)))
      );
    case GeolocatorType.TX:
      return promiseFirst(
        txLocate(options),
        Promise.any([h5Locate, gdLocate, bdLocate].map((fcn) => fcn(options)))
      );
    default:
      return Promise.any(
        [h5Locate, gdLocate, bdLocate, txLocate].map((fcn) => fcn(options))
      );
  }
};
