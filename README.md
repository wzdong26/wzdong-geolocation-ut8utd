[Web geolocation] Web 地理定位函数封装
1 实现目标
基于 H5、高德、百度、腾讯的 geolocation 封装一套 Promise 函数 api geolocation；调用方式：
geolocation().then().catch()
2 函数类型描述

1. geolocation: IGeolocation
   interface IGeolocation {
   (
   options?: IGeolocationOptions,
   geolocator?: GeolocatorType
   ): Promise<IGeolocationResult>;
   }
2. options: IGeolocationOptions
   prop type 描述
   accuracyThreshold number 精度阈值，取低于该阈值的定位结果，单位：米
   maximumAge number 定位的缓存时间，单位：毫秒
   timeout number 定位的超时时间，单位：毫秒
   interface IGeolocationOptions {
   accuracyThreshold?: number;
   maximumAge?: number;
   timeout?: number;
   }
3. geolocator: GeolocatorType，地理定位器类型：H5、GD（高德）、BD（百度）、TX（腾讯）
   enum GeolocatorType {
   H5 = 1,
   GD,
   BD,
   TX,
   }
4. IGeolocationResult，定位成功后 resolve 中返回的 result 数据类型
   interface IGeolocationResult {
   readonly accuracy: number;
   readonly address?: any;
   readonly coords: {
   lng: number;
   lat: number;
   };
   readonly heading?: number | null;
   readonly speed?: number | null;
   readonly timestamp: number;
   readonly geolocatorType?: GeolocatorType | null;
   readonly pois?: any[];
   readonly roads?: any[];
   readonly crosses?: number;
   }
   3 函数封装
   H5、高德、百度、腾讯的 geolocation api 都是采用回调函数的方式调用的，这里采用 Promise 的方式对其进行封装，每个 api 的封装方式都是差不多的，这里就以封装 H5 的 geolocation 为例：
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
   ... ...
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
   ... ...
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
   4 多种定位函数 api 集成
   基于上述封装实现的 H5、高德、百度、腾讯 Promise 函数 api，编写 geolocation 函数实现同时调用这 4 种定位 api，思路如下：
   通过 geolocation 函数入参 geolocator: GeolocatorType 的类型，优先采用该 geolocator 类型的定位器；未传入参 geolocator 的情况下将默认采用 Promise.any()函数返回最先实现的 Promise 对象结果，从而保证定位的实效性。代码实现如下：
   export const geolocation: IGeolocation = (options = {}, geolocator) => {
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
   ... ...
   default:
   return Promise.any(
   [h5Locate, gdLocate, bdLocate, txLocate].map((fcn) => fcn(options))
   );
   }
   };
   其中 promiseFirst 是一个 Promise 函数，其 resolve 的结果会优先返回入参中前面的 Promise 函数 resolve 的结果。该函数实现如下：
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
