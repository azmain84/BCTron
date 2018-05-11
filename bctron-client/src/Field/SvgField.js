import * as d3 from 'd3';
import * as _ from 'lodash';
import * as $ from "jquery";
import 'tooltipster';
import {DIM_X, DIM_Y} from '../blockChain/info';
import {guid} from '../util/random';

import './Field.css';

const FIELD_PADDING = 20;

const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

const emptyFlattenedMatrix = () => {
    const flattenedMatrix = [];
    _.range(DIM_Y).forEach((y) => {
        _.range(DIM_X).forEach((x) => {
            const uuid = guid();
            const hash = "0";
            const id = "";
            flattenedMatrix.push({id, x, y, hash, uuid});
        })
    });

    return flattenedMatrix;
}

const flattenCoords = (x, y) => {
    return Number(y) * DIM_X + Number(x);
}

const idFromObjectWithXAndY = (obj) => {
    return "_" + obj.x + "_" + obj.y;
}

const TOOLTIP_CLASS = "rect-tooltip";
const TOOLTIP_SELECTOR = "." + TOOLTIP_CLASS;

export class SvgField {
    constructor(containerSelector, width, height, hoverCallback) {
        const self = this;

        this.width = width;
        this.height = height;
        this.hoverCallback = hoverCallback;

        const _tileWidth = width*2 / DIM_X;
        const _tileHeight = height*2 / DIM_Y;
        this.tileSize = Math.min(_tileHeight, _tileWidth);
        this.fieldWidth = this.tileSize * DIM_X;
        this.fieldHeight = this.tileSize * DIM_Y;

        this.initSvg(containerSelector);
        this.initAxes();
        this.initTooltip(containerSelector);

        this.flattenedMatrix = emptyFlattenedMatrix();
        this.history = {};

        this.isOver = false;
    }

    initTooltip(selector) {

        d3.select(selector)
            .append("div")
            .attr("class", TOOLTIP_CLASS);
    }

    startTooltip(text) {
        const tooltip = $(TOOLTIP_SELECTOR);
        tooltip.addClass("active");
        tooltip.html(text);
    }

    stopTooltip() {
        const tooltip = $(TOOLTIP_SELECTOR);
        tooltip.removeClass("active");
    }

    positionTooltip(x, y) {
        const tooltip = $(TOOLTIP_SELECTOR);
        tooltip.css({
            left: x + 50,
            top: y + 50
        });
    }

    initSvg(selector) {
        const self = this;

        const zoomed = () => {
            const event = d3.event;
            console.log(event);
            this.gfield.attr("transform", d3.event.transform);
        }

        const zoom = d3.zoom()
            .scaleExtent([.2, 100])
            .on("zoom", zoomed);

        const svg = d3.select(selector)
            .append("svg")
            .attr("width", self.width + FIELD_PADDING*2)
            .attr("height", self.height + FIELD_PADDING*2)
            .on("mouseout", () => {
                if(_.isFunction(this.hoverCallback)) {
                    self.isOver = false;
                    if(_.isUndefined(self.timer)) {
                        self.timer = setTimeout(() => {
                            self.timer = undefined;
                            if(!self.isOver) {
                                this.hoverCallback(undefined, undefined, []);
                            }
                        }, 5000);
                    }
                }

                self.stopTooltip();
            });

        svg.call(zoom);

        this.gfield = svg.append("g")
            .attr("class", "field")
            .attr("transform", "translate(" + FIELD_PADDING + ", " + FIELD_PADDING + ")");
        this.grects = this.gfield.append("g").attr("class", "lines");
        this.gaxes = this.gfield.append("g").attr("class", "axes");

        this.root = svg;
    }

    removeAxisLabels(axisSelector) {
        const textNodes = this.gaxes.selectAll(axisSelector + " text")
            .each(function () {
                const textNode = d3.select(this);
                const number = Number(textNode.text());
                if(number % 10 != 0) {
                    textNode.remove();
                }
            })
    }

    initAxes() {
        const self = this;
        this.xScale = d3.scaleLinear()
            .domain([0, DIM_X])
            .range([0, self.fieldWidth]);

        this.yScale = d3.scaleLinear()
            .domain([0, DIM_Y])
            .range([0, self.fieldHeight]);

        this.xAxis = d3.axisBottom(self.xScale)
            .ticks(DIM_X + 1)
            .tickSize(self.fieldHeight)
            .tickPadding(-FIELD_PADDING - this.fieldHeight);

        this.yAxis = d3.axisRight(self.yScale)
            .ticks(DIM_Y + 1)
            .tickSize(self.fieldWidth)
            .tickPadding(-FIELD_PADDING - this.fieldWidth);

        this.gxaxis = this.gaxes.append("g")
            .attr("class", "axis axis-x")
            .call(self.xAxis);

        this.gyaxis = this.gaxes.append("g")
            .attr("class", "axis axis-y")
            .call(self.yAxis);

        this.removeAxisLabels(".axis-x");
        this.removeAxisLabels(".axis-y");
    }

    xcoord(xpos) {
        return xpos * this.tileSize;
    }

    ycoord(ypos) {
        return ypos * this.tileSize;
    }

    putInHistory(position) {
        const id = idFromObjectWithXAndY(position);
        if(_.isUndefined(this.history[id])) {
            this.history[id] = [position];
        }
        else {
            this.history[id].push(position);
        }
    }

    getHistoryIncludingCurrentPosition(position) {
        const id = idFromObjectWithXAndY(position);
        const history = this.history[id];
        if(_.isEmpty(history)) {
            return [position];
        }
        return [...history, position];
    }

    getAllIdsFromPosition(position) {
        const history = this.getHistoryIncludingCurrentPosition(position);
        return history.map(position => position.id);
    }

    newPosition(position) {
        const index = flattenCoords(position.x, position.y);
        const currentPositionAtIndex = this.flattenedMatrix[index];
        if(!_.isEmpty(currentPositionAtIndex.id)) {
            this.putInHistory(currentPositionAtIndex);
        }
        this.flattenedMatrix[index] = position;
        this.drawMatrix();
    }

    removeAllHeads() {
        this.grects.selectAll(".head")
            .classed("head", false);
    }

    addHead(head) {
        const xyClass = idFromObjectWithXAndY(head);
        this.grects.selectAll("." + xyClass)
            .classed("head", true);
    }

    drawHeads() {
        this.removeAllHeads();
        _.values(this.heads).forEach((head) => {
            this.addHead(head);
        })
    }

    newHeads(heads) {
        this.heads = heads;
        this.drawHeads();
    }

    isHead(x, y) {
        let isHead = false;
        _.values(this.heads).forEach((head) => {
            if(head.x === x && head.y === y) {
                isHead = true;
            }
        });

        return isHead;
    }

    getRects() {
        return this.gfield.selectAll("rect.position");
    }

    highlight(id, trueForOn) {
        this.grects.selectAll(".position." + id)
            .classed("highlight", trueForOn);
    }

    drawMatrix() {
        const self = this;

        const data = this.grects.selectAll("rect.position").data(this.flattenedMatrix, d => d.x + "-" + d.y);

        data.enter()
            .append("rect")
            .attr("width", this.tileSize)
            .attr("height", this.tileSize)
            .attr("x", d => this.xcoord(d.x))
            .attr("y", d => this.ycoord(d.y))
            .merge(data)
            .attr("fill", d => _.isEmpty(d.id) ? "white" : colorScale(d.id))
            .attr("class", d => "position " + idFromObjectWithXAndY(d) + " " + self.getAllIdsFromPosition(d).join(" "))
            .on("mouseover", d => {
                self.isOver = true;
                if(_.isFunction(self.hoverCallback)) {
                    const historyIncludingCurrentPosition = self.getHistoryIncludingCurrentPosition(d);
                    self.hoverCallback(d.x, d.y, historyIncludingCurrentPosition);
                }

                const isHead = self.isHead(d.x, d.y);
                self.startTooltip(d.x + " / " + d.y
                    + (_.isEmpty(d.id) ? "" : " (" + d.id + ")")
                    + (self.isHead(d.x, d.y) ? " HEAD" : "")
                );
            })
            .on("mousemove", () => {
                const _d3 = d3;
                const mousePosition = d3.mouse(self.root.node());
                self.positionTooltip(mousePosition[0], mousePosition[1]);
            })

        this.drawHeads();
    }
}
