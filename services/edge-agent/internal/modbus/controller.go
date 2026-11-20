package modbus

import (
	"errors"
	"fmt"
	"time"

	goburrow "github.com/goburrow/modbus"
)

const (
	CoilBarrierOpen  = 1
	CoilBarrierClose = 2
	CoilBarrierLock  = 3
	DiscreteLoop1    = 0x1003
	DiscreteLoop2    = 0x1004
)

type Device interface {
	Open() error
	Close() error
	ReadDiscreteInputs(address, quantity uint16) ([]byte, error)
	WriteSingleCoil(address, value uint16) error
}

type Controller struct {
	device Device
}

func NewTCPController(address string, timeout time.Duration) (*Controller, error) {
	handler := goburrow.NewTCPClientHandler(address)
	handler.Timeout = timeout
	handler.SlaveId = 1
	if err := handler.Connect(); err != nil {
		return nil, err
	}
	handler.Timeout = timeout
	client := goburrow.NewClient(handler)
	return &Controller{device: &tcpDevice{handler: handler, client: client}}, nil
}

func NewController(device Device) *Controller {
	return &Controller{device: device}
}

func (c *Controller) Close() error {
	if c.device == nil {
		return errors.New("modbus device is not configured")
	}
	return c.device.Close()
}

func (c *Controller) LoopStates() (loop1, loop2 bool, err error) {
	if c.device == nil {
		return false, false, errors.New("modbus device is not configured")
	}
	results, err := c.device.ReadDiscreteInputs(DiscreteLoop1, 2)
	if err != nil {
		return false, false, err
	}
	if len(results) < 1 {
		return false, false, fmt.Errorf("loop state response too short")
	}
	loop1 = results[0]&0x01 != 0
	loop2 = len(results) > 0 && results[0]&0x02 != 0
	return
}

func (c *Controller) OpenBarrier() error {
	if c.device == nil {
		return errors.New("modbus device is not configured")
	}
	return c.device.WriteSingleCoil(CoilBarrierOpen, 0xFF00)
}

func (c *Controller) CloseBarrier() error {
	_, loop2, err := c.LoopStates()
	if err != nil {
		return err
	}
	if loop2 {
		return c.LockBarrier("LOOP_2_SAFETY_PRESENCE")
	}
	return c.device.WriteSingleCoil(CoilBarrierClose, 0xFF00)
}

func (c *Controller) LockBarrier(reason string) error {
	if err := c.device.WriteSingleCoil(CoilBarrierLock, 0xFF00); err != nil {
		return err
	}
	return fmt.Errorf("anti-smash interlock active: %s", reason)
}

type tcpDevice struct {
	handler *goburrow.TCPClientHandler
	client  goburrow.Client
}

func (d *tcpDevice) Open() error {
	return d.handler.Connect()
}

func (d *tcpDevice) Close() error {
	d.handler.Close()
	return nil
}

func (d *tcpDevice) ReadDiscreteInputs(address, quantity uint16) ([]byte, error) {
	return d.client.ReadDiscreteInputs(address, quantity)
}

func (d *tcpDevice) WriteSingleCoil(address, value uint16) error {
	_, err := d.client.WriteSingleCoil(address, value)
	return err
}
