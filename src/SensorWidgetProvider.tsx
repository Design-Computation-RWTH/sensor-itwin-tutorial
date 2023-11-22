import {
  StagePanelLocation,
  StagePanelSection,
  UiItemsProvider,
  Widget,
  WidgetState,
  useActiveIModelConnection,
} from "@itwin/appui-react";

import { TimeSeries } from "pondjs";
import {
  Charts,
  ChartContainer,
  ChartRow,
  YAxis,
  LineChart,
  //@ts-ignore
} from "react-timeseries-charts";

import React from "react";

export function SensorWidget() {
  const [elementName, setElementName] = React.useState("");
  const [elementId, setElementId] = React.useState("");
  const [timeseries, setTimeseries] = React.useState<TimeSeries | null>(null);

  const iModelConnection = useActiveIModelConnection();

  React.useEffect(() => {
    iModelConnection?.selectionSet.onChanged.addListener((e) => {
      e.set.elements.forEach((element) => {
        iModelConnection?.elements.getProps(element).then((e) => {
          if (e[0].userLabel && e[0].id) {
            setElementId(e[0].id);
            setElementName(e[0].userLabel);
          }
        });
      });
    });
    return () => {
      iModelConnection?.selectionSet.onChanged.removeListener(() => {});
    };
  }, []);

  React.useEffect(() => {
    if (elementId === "") {
      return;
    } else {
      const requestOptions: RequestInit = {
        method: "GET",
        redirect: "follow",
      };
      if (!process.env.IMJS_SENSOR_ENDPOINT) return;
      fetch(
        process.env.IMJS_SENSOR_ENDPOINT +
          "/project/project_1/sensor/" +
          elementId,
        requestOptions
      )
        .then((response) => response.json())
        .then((result) => {
          const datapoints = result["data"];
          const tempTimeseries = new TimeSeries({
            name: "sensor data",
            columns: ["index", "value"],
            points: datapoints,
          });
          setTimeseries(tempTimeseries);
        })
        .catch((error) => console.log("error", error));
    }
  }, [elementId]);

  return (
    <div>
      <div>Element Name: {elementName}</div>
      <div>Element Id: {elementId}</div>
      {timeseries === null ? (
        <></>
      ) : (
        <ChartContainer
          timeRange={timeseries.timerange()}
          format="%b '%y"
          width={400}
        >
          <ChartRow height="150">
            <YAxis
              id="value"
              label="Value"
              min={timeseries.min("value", () => {})}
              max={timeseries.max("value")}
              width="30"
            />
            <Charts>
              <LineChart axis="value" series={timeseries} />
            </Charts>
          </ChartRow>
        </ChartContainer>
      )}
    </div>
  );
}

export class SensorWidgetUiProvider implements UiItemsProvider {
  public readonly id: string = "SensorWidgetUiProvider";

  public provideWidgets(
    _stageId: string,
    _stageUsage: string,
    location: StagePanelLocation,
    _section?: StagePanelSection
  ): ReadonlyArray<Widget> {
    const widgets: Widget[] = [];

    if (location === StagePanelLocation.Right) {
      widgets.push({
        id: "SensorWidget",
        label: "SensorWidget",
        defaultState: WidgetState.Open,
        content: <SensorWidget />,
      });
    }
    return widgets;
  }
}
